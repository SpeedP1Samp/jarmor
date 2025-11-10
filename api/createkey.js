const express = require("express");
const router = express.Router();
const pool = require("../db");
const { randomBytes } = require("crypto");

router.get("/", async (req, res) => {
  const { userdiscord, duration } = req.query;
  if (!userdiscord || !duration) return res.status(400).json({ error: "Missing params" });

  const key = randomBytes(4).toString("hex").toUpperCase(); // 8 caracteres
  const created_at = Math.floor(Date.now() / 1000); // timestamp Unix em segundos

  try {
    const query = `
      INSERT INTO keys (key, hwid, created_at, duration, userdiscord)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [key, null, created_at, parseInt(duration), userdiscord];
    const result = await pool.query(query, values);
    const newKey = result.rows[0];

    res.json({
      Key: newKey.key,
      Hwid: newKey.hwid,
      Temp: newKey.duration,
      Userdiscord: newKey.userdiscord
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
