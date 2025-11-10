const express = require("express");
const router = express.Router();
const pool = require("../db");
const { randomBytes } = require("crypto");

router.get("/", async (req, res) => {
  try {
    const { userdiscord, duration } = req.query;

    // Validação básica de parâmetros
    if (!userdiscord || typeof userdiscord !== "string" || userdiscord.trim() === "") {
      return res.status(400).json({ error: "Parâmetro 'userdiscord' inválido" });
    }

    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt <= 0) {
      return res.status(400).json({ error: "Parâmetro 'duration' inválido" });
    }

    const key = randomBytes(4).toString("hex").toUpperCase(); // 8 caracteres
    const created_at = Math.floor(Date.now() / 1000); // timestamp Unix em segundos

    // Garantir que a tabela exista
    await pool.query(`
      CREATE TABLE IF NOT EXISTS keys (
        id SERIAL PRIMARY KEY,
        key VARCHAR(16) UNIQUE NOT NULL,
        hwid VARCHAR(64),
        created_at BIGINT NOT NULL,
        duration BIGINT NOT NULL,
        userdiscord VARCHAR(64) NOT NULL
      );
    `);

    // Inserir a nova key
    const query = `
      INSERT INTO keys (key, hwid, created_at, duration, userdiscord)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [key, null, created_at, durationInt, userdiscord];
    const result = await pool.query(query, values);
    const newKey = result.rows[0];

    res.json({
      Key: newKey.key,
      Hwid: newKey.hwid,
      Temp: newKey.duration,
      Userdiscord: newKey.userdiscord
    });

  } catch (err) {
    console.error("Erro no createkey:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
