const express = require("express");
const router = express.Router();
const pool = require("../db");

router.use(express.json());

router.all("/", async (req, res) => {
  const key = req.query.key || req.body.key;
  const hwid = req.body.hwid || null;

  if (!key) return res.status(400).json({ error: "Missing key" });

  try {
    const result = await pool.query("SELECT * FROM keys WHERE key=$1", [key]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Key not found" });

    const keyData = result.rows[0];
    const now = Math.floor(Date.now() / 1000);
    const tempRemaining = keyData.created_at + keyData.duration - now;

    // Key expirada
    if (tempRemaining <= 0) {
      return res.json({
        Key: keyData.key,
        Hwid: keyData.hwid,
        Temp: 0,
        Userdiscord: keyData.userdiscord,
        message: "expirada"
      });
    }

    // Associar HWID se estiver null e se enviado no POST
    if (req.method === "POST") {
      if (!hwid) return res.status(400).json({ error: "Missing hwid in POST" });

      if (!keyData.hwid) {
        await pool.query("UPDATE keys SET hwid=$1 WHERE key=$2", [hwid, key]);
        keyData.hwid = hwid;
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
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
