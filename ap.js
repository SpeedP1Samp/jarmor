// api/index.js
const axios = require('axios');

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/SpeedP1Samp/db/main/keys.json';
const GITHUB_API_URL = 'https://api.github.com/repos/SpeedP1Samp/db/contents/keys.json';

// Token do GitHub (em produção, use variáveis de ambiente)
const GITHUB_TOKEN = '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';

// Headers para as requisições da API do GitHub
const githubHeaders = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
};

// Função para ler o arquivo JSON do GitHub
async function readKeysFile() {
  try {
    const response = await axios.get(GITHUB_RAW_URL);
    return response.data;
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    return {};
  }
}

// Função para salvar no arquivo JSON do GitHub
async function saveKeysFile(keysData) {
  try {
    // Primeiro, obtém o SHA do arquivo atual
    const getResponse = await axios.get(GITHUB_API_URL, {
      headers: githubHeaders
    });
    
    const sha = getResponse.data.sha;
    const content = Buffer.from(JSON.stringify(keysData, null, 2)).toString('base64');
    
    const response = await axios.put(
      GITHUB_API_URL,
      {
        message: 'Atualização de keys',
        content: content,
        sha: sha
      },
      {
        headers: githubHeaders
      }
    );
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return false;
  }
}

// Função para verificar se a key existe
function checkKey(keys, key) {
  return keys[key] || null;
}

// Função para criar uma nova key
function createKey(keys, timestamp, userdiscord) {
  const key = 'key' + Math.random().toString(36).substr(2, 9);
  const newKey = {
    Key: key,
    Hwid: null,
    Temp: timestamp,
    Userdiscord: userdiscord,
    CreatedAt: new Date().toISOString()
  };
  keys[key] = newKey;
  return newKey;
}

export default async function handler(req, res) {
  const { method, query, body } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const keys = await readKeysFile();

    // Rota: Verificar key com HWID
    if (query.checkhwid) {
      const keyData = checkKey(keys, query.checkhwid);
      
      if (!keyData) {
        return res.status(404).json({ error: 'Key não encontrada' });
      }

      return res.json({
        Key: keyData.Key,
        Hwid: keyData.Hwid,
        Temp: keyData.Temp,
        Userdiscord: keyData.Userdiscord
      });
    }

    // Rota: Criar nova key
    if (query.createkey && query.userdiscord) {
      const timestamp = parseInt(query.createkey);
      const userdiscord = query.userdiscord;
      
      if (isNaN(timestamp) || timestamp <= 0) {
        return res.status(400).json({ error: 'Timestamp inválido' });
      }

      if (!userdiscord || userdiscord.trim() === '') {
        return res.status(400).json({ error: 'Userdiscord é obrigatório' });
      }

      const newKey = createKey(keys, timestamp, userdiscord);
      const saved = await saveKeysFile(keys);
      
      if (!saved) {
        return res.status(500).json({ error: 'Erro ao salvar key' });
      }

      return res.json({
        success: true,
        key: newKey.Key,
        temp: newKey.Temp,
        userdiscord: newKey.Userdiscord
      });
    }

    // Rota: Verificar key (GET)
    if (query.checkkey) {
      const keyData = checkKey(keys, query.checkkey);
      
      if (!keyData) {
        return res.status(404).json({ error: 'Key não encontrada' });
      }

      // Verifica se o tempo expirou
      const now = Date.now();
      const timeLeft = keyData.Temp - now;
      
      if (timeLeft <= 0) {
        return res.json({
          Key: keyData.Key,
          Hwid: keyData.Hwid,
          Temp: 0,
          Userdiscord: keyData.Userdiscord,
          Status: 'Expirada'
        });
      }

      return res.json({
        Key: keyData.Key,
        Hwid: keyData.Hwid,
        Temp: timeLeft,
        Userdiscord: keyData.Userdiscord,
        Status: 'Ativa'
      });
    }

    // Rota: Atualizar HWID (POST)
    if (method === 'POST' && body && body.key && body.hwid) {
      const keyData = checkKey(keys, body.key);
      
      if (!keyData) {
        return res.status(404).json({ error: 'Key não encontrada' });
      }

      // Verifica se já tem HWID
      if (keyData.Hwid && keyData.Hwid !== null && keyData.Hwid !== 'null') {
        return res.status(400).json({ 
          error: 'Key já possui HWID registrado',
          blocked: true
        });
      }

      // Atualiza o HWID
      keyData.Hwid = body.hwid;
      // Mantém o Userdiscord original que foi definido na criação

      const saved = await saveKeysFile(keys);
      
      if (!saved) {
        return res.status(500).json({ error: 'Erro ao atualizar HWID' });
      }

      return res.json({
        success: true,
        message: 'HWID atualizado com sucesso',
        key: keyData.Key,
        hwid: keyData.Hwid,
        userdiscord: keyData.Userdiscord
      });
    }

    return res.status(400).json({ error: 'Parâmetro inválido' });

  } catch (error) {
    console.error('Erro no handler:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
