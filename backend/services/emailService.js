const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.email.uk-london-1.oci.oraclecloud.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true', 
      requireTLS: true, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Serveur SMTP connecté avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SMTP:', error.message);
      return false;
    }
  }

  async sendVerificationEmail(email, verificationToken, userName = '') {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'StageTrack'}" <${process.env.SMTP_FROM || 'noreply@stagetrack.tech'}>`,
      to: email,
      subject: 'Vérification de votre compte StageTrack',
      html: this.getVerificationEmailTemplate(userName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de vérification envoyé à ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email vérification:', error.message);
      throw new Error("Impossible d'envoyer l'email de vérification");
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName = '') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'StageTrack'}" <${process.env.SMTP_FROM || 'noreply@stagetrack.tech'}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe StageTrack',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de reset mot de passe envoyé à ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email reset:', error.message);
      throw new Error("Impossible d'envoyer l'email de réinitialisation");
    }
  }

  async sendTemporaryPasswordEmail(email, temporaryPassword, userName = '') {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'StageTrack'}" <${process.env.SMTP_FROM || 'noreply@stagetrack.tech'}>`,
      to: email,
      subject: 'Votre compte StageTrack a été créé',
      html: this.getTemporaryPasswordEmailTemplate(userName, temporaryPassword, loginUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email mot de passe temporaire envoyé à ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email mot de passe temporaire:', error.message);
      throw new Error("Impossible d'envoyer l'email de mot de passe temporaire");
    }
  }

  async sendWelcomeEmail(email, userName = '', userRole = '') {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'StageTrack'}" <${process.env.SMTP_FROM || 'noreply@stagetrack.tech'}>`,
      to: email,
      subject: 'Bienvenue sur StageTrack !',
      html: this.getWelcomeEmailTemplate(userName, userRole),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de bienvenue envoyé à ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email bienvenue:', error.message);
      throw new Error("Impossible d'envoyer l'email de bienvenue");
    }
  }

  // ─── Templates ──────────────────────────────────────────────────────────────

  getVerificationEmailTemplate(userName, verificationUrl) {
    return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérification StageTrack</title>
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4}
    .container{max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .header{background:#2563eb;color:#fff;padding:30px 20px;text-align:center}
    .header h1{margin:0;font-size:24px}.header p{margin:5px 0 0;opacity:.9}
    .content{padding:35px 30px;background:#f9fafb}
    .button{display:inline-block;background:#2563eb;color:#fff;padding:14px 34px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}
    .url{word-break:break-all;color:#2563eb;font-size:13px}
    .footer{text-align:center;padding:20px;color:#999;font-size:12px;background:#fff}
  </style>
</head><body>
  <div class="container">
    <div class="header"><h1>🎓 StageTrack</h1><p>Vérification de votre compte</p></div>
    <div class="content">
      <h2>Bonjour${userName ? ' ' + userName : ''},</h2>
      <p>Merci de vous être inscrit sur <strong>StageTrack</strong> ! Cliquez ci-dessous pour activer votre compte :</p>
      <div style="text-align:center"><a href="${verificationUrl}" class="button">✅ Vérifier mon email</a></div>
      <p style="font-size:13px;color:#666">Ou copiez ce lien dans votre navigateur :</p>
      <p class="url">${verificationUrl}</p>
      <p><strong>⏰ Ce lien expire dans 24 heures.</strong></p>
    </div>
    <div class="footer"><p>© 2025 StageTrack Tech. Tous droits réservés.</p></div>
  </div>
</body></html>`;
  }

  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation StageTrack</title>
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4}
    .container{max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .header{background:#dc2626;color:#fff;padding:30px 20px;text-align:center}
    .header h1{margin:0;font-size:24px}.header p{margin:5px 0 0;opacity:.9}
    .content{padding:35px 30px;background:#f9fafb}
    .button{display:inline-block;background:#dc2626;color:#fff;padding:14px 34px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}
    .url{word-break:break-all;color:#dc2626;font-size:13px}
    .footer{text-align:center;padding:20px;color:#999;font-size:12px;background:#fff}
  </style>
</head><body>
  <div class="container">
    <div class="header"><h1>🔐 StageTrack</h1><p>Réinitialisation du mot de passe</p></div>
    <div class="content">
      <h2>Bonjour${userName ? ' ' + userName : ''},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous :</p>
      <div style="text-align:center"><a href="${resetUrl}" class="button">🔑 Réinitialiser mon mot de passe</a></div>
      <p style="font-size:13px;color:#666">Ou copiez ce lien :</p>
      <p class="url">${resetUrl}</p>
      <p><strong>⏰ Ce lien expire dans 1 heure.</strong></p>
      <p style="color:#888;font-size:13px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>
    <div class="footer"><p>© 2025 StageTrack Tech. Tous droits réservés.</p></div>
  </div>
</body></html>`;
  }

  getTemporaryPasswordEmailTemplate(userName, temporaryPassword, loginUrl) {
    return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte créé - StageTrack</title>
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4}
    .container{max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .header{background:#7c3aed;color:#fff;padding:30px 20px;text-align:center}
    .header h1{margin:0;font-size:24px}.header p{margin:5px 0 0;opacity:.9}
    .content{padding:35px 30px;background:#f9fafb}
    .password-box{background:#fff;border:2px dashed #7c3aed;border-radius:8px;padding:16px 24px;text-align:center;margin:20px 0}
    .password-box .label{font-size:13px;color:#666;margin-bottom:8px}
    .password-box .pwd{font-size:22px;font-weight:bold;letter-spacing:3px;color:#7c3aed;font-family:monospace}
    .button{display:inline-block;background:#7c3aed;color:#fff;padding:14px 34px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}
    .footer{text-align:center;padding:20px;color:#999;font-size:12px;background:#fff}
  </style>
</head><body>
  <div class="container">
    <div class="header"><h1>🎓 StageTrack</h1><p>Votre compte a été créé</p></div>
    <div class="content">
      <h2>Bonjour${userName ? ' ' + userName : ''},</h2>
      <p>Un administrateur a créé votre compte sur <strong>StageTrack</strong>. Voici votre mot de passe temporaire :</p>
      <div class="password-box">
        <div class="label">Mot de passe temporaire</div>
        <div class="pwd">${temporaryPassword}</div>
      </div>
      <p>⚠️ <strong>Vous devrez changer ce mot de passe lors de votre première connexion.</strong></p>
      <div style="text-align:center"><a href="${loginUrl}" class="button">🔐 Se connecter</a></div>
    </div>
    <div class="footer"><p>© 2025 StageTrack Tech. Tous droits réservés.</p></div>
  </div>
</body></html>`;
  }

  getWelcomeEmailTemplate(userName, userRole) {
    return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue StageTrack</title>
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4}
    .container{max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .header{background:#10b981;color:#fff;padding:30px 20px;text-align:center}
    .header h1{margin:0;font-size:24px}
    .content{padding:35px 30px;background:#f9fafb}
    .button{display:inline-block;background:#10b981;color:#fff;padding:14px 34px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}
    .footer{text-align:center;padding:20px;color:#999;font-size:12px;background:#fff}
  </style>
</head><body>
  <div class="container">
    <div class="header"><h1>🎉 StageTrack</h1></div>
    <div class="content">
      <h2>Bienvenue${userName ? ', ' + userName : ''} !</h2>
      <p>Votre compte a été créé avec succès en tant que <strong>${userRole}</strong>.</p>
      <div style="text-align:center">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Me connecter</a>
      </div>
    </div>
    <div class="footer"><p>© 2025 StageTrack Tech. Tous droits réservés.</p></div>
  </div>
</body></html>`;
  }
}

module.exports = EmailService;