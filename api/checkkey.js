const express = require("express");
const router = express.Router();
const { getKeys, updateKeys } = require("../github");

router.use(express.json());

router.all("/", async (req, res) => {
  try {
    const key = req.query.key || req.body.key;
    const hwid = req.body.hwid || null;
    if (!key) return res.status(400).json({ error: "Missing key" });

    const { keys, sha } = await getKeys();
    const index = keys.findIndex(k => k.key === key);
    if (index === -1) return res.status(404).json({ error: "Key not found" });

    const keyData = keys[index];
    const now = Math.floor(Date.now() / 1000);
    const tempRemaining = keyData.created_at + keyData.duration - now;

    if (tempRemaining <= 0) {
      return res.json({
        Key: keyData.key,
        Hwid: keyData.hwid,
        Temp: 0,
        Userdiscord: keyData.userdiscord,
        message: "expirada"
      });
    }

    // POST → associar HWID
    if (req.method === "POST") {
      if (!hwid) return res.status(400).json({ error: "Missing hwid in POST" });

      if (!keyData.hwid) {
        keyData.hwid = hwid;
        keys[index] = keyData;
        await updateKeys(keys, sha, `Associate HWID for ${key}`);
        return res.json({
          Key: keyData.key,
          Hwid: hwid,
          Temp: tempRemaining,
          Userdiscord: keyData.userdiscord,
          message: "associado"
        });
      } else if (keyData.hwid !== hwid) {
        return res.json({
          Key: keyData.key,
          Hwid: keyData.hwid,
          Temp: tempRemaining,
          Userdiscord: keyData.userdiscord,
          message: "bloqueado"
        });
      }
    }

    // GET simples
    res.json({
      Key: keyData.key,
      Hwid: keyData.hwid || null,
      Temp: tempRemaining,
      Userdiscord: keyData.userdiscord
    });

  } catch (err) {
    console.error("Erro checkkey:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
