﻿(function () {
  const LANG_ORDER = ["en", "it", "es"];
  const LANG_STORAGE_KEY = "colabgames_lang";
  let activeLang = "en";

  const I18N = {
    en: {
      common: {
        menu: "Menu",
        navHome: "Home",
        navChessguess: "ChessGuess",
        navSupport: "Support",
        footerPrivacy: "Privacy",
        footerTerms: "Terms",
        footerSupport: "Support",
        footerDelete: "Delete Account",
        langButtonTitle: "Change language",
        login: "Login",
        logout: "Logout",
        register: "Register",
        account: "Account",
        username: "Username",
        email: "Email",
        password: "Password",
        oldPassword: "Current password",
        newPassword: "New password",
        forgotPassword: "Forgot password?",
        loginTitle: "Login",
        registerTitle: "Register",
        forgotTitle: "Forgot password",
        confirm: "Confirm",
        backToLogin: "Back to login",
        sendResetLink: "Send reset link",
        resetPassword: "Reset password",
        changePassword: "Change password",
        deleteAccountAction: "Delete account",
        deleteConfirm: "Are you sure you want to delete your account? This cannot be undone.",
        resetSent: "If the email exists, a reset link has been sent.",
        resetPageTitle: "Reset Password",
        resetPageButton: "Save new password",
        resetPageSuccess: "Password updated. You can now log in.",
        resetPageMissingToken: "Reset link is invalid or missing token.",
        loginNoEmail: "Login uses only username and password.",
        emailUsage: "Email is used only for registration and password recovery.",
        authError: "Something went wrong. Please try again.",
        authWelcome: "Hello"
      },
      home: {
        metaTitle: "ColabGames | ChessGuess",
        metaDescription: "ColabGames builds strategy games with a competitive focus. Discover ChessGuess and official support links.",
        kicker: "INDIE GAME STUDIO",
        title: "ColabGames builds games around fast decisions.",
        lead: "Current focus: ChessGuess, a hidden-information strategy game with bot mode, custom rooms, and competitive online multiplayer.",
        playButton: "Play ChessGuess Web",
        appButton: "Game page",
        linksTitle: "Official Links",
        linkPrivacy: "Privacy Policy",
        linkTerms: "Terms and Conditions",
        linkSupport: "Support",
        linkDelete: "Delete Account"
      },
      chess: {
        metaTitle: "ChessGuess | ColabGames",
        metaDescription: "Official ChessGuess page with key features and web app links.",
        kicker: "GAME PAGE",
        title: "ChessGuess",
        lead: "Hidden pieces, visible strategy. Read your opponent plan before you see every piece.",
        openWeb: "Open Web App",
        downloadApk: "Download Debug APK",
        featuresTitle: "Main Features",
        feature1: "Bot mode with progressive difficulty levels",
        feature2: "Custom rooms with shareable code",
        feature3: "Online matchmaking with rating",
        feature4: "Player profile with match history and avatar unlocks",
        feature5: "Standard login and Google login"
      },
      support: {
        metaTitle: "Support | ColabGames",
        metaDescription: "Official ColabGames support page for ChessGuess: contacts, quick FAQ, and bug report template.",
        kicker: "SUPPORT",
        title: "ChessGuess Support",
        intro: "Use these channels for technical issues, account problems, or multiplayer reports.",
        emailButton: "Email support",
        deleteButton: "Delete account",
        contactsTitle: "Contacts",
        emailLabel: "Email:",
        responseTime: "Average response time: 2-5 business days",
        languages: "Supported languages: Italian, English, Spanish",
        faqTitle: "Quick FAQ",
        faq1: "Cannot log in: verify username/password or Google login.",
        faq2: "Online match not starting: check connection and retry matchmaking.",
        faq3: "Supporter purchase issue: send a ticket with username and receipt.",
        templateTitle: "Bug Report Template",
        templateIntro: "To speed up troubleshooting, copy this format into your email:",
        templateBody: "Subject: ChessGuess bug report\n\nUsername:\nPlatform: Android / Web\nApp version:\nDate and time of issue:\nShort description:\nSteps to reproduce:\nScreenshot or video (if available):"
      },
      privacy: {
        metaTitle: "Privacy Policy | ColabGames",
        metaDescription: "Official ColabGames privacy policy for ChessGuess.",
        kicker: "LEGAL",
        title: "Privacy Policy",
        effectiveDate: "Effective date: April 9, 2026",
        s1h: "1. Data Controller",
        s1p: "ColabGames is the data controller for personal data processed through ChessGuess and related online services.",
        s2h: "2. Data We Collect",
        s2l1: "Account data: username and encrypted credentials (hash + salt).",
        s2l2: "Google login data: Google identifier and basic profile data when Google sign-in is used.",
        s2l3: "Gameplay data: rating, match stats, match history, and unlocked avatars.",
        s2l4: "Technical data: connection and security logs (rate limits, sessions).",
        s2l5: "Purchase data: hashed Google Play purchase tokens used for supporter reward verification.",
        s3h: "3. Purposes",
        s3l1: "Create and manage your account.",
        s3l2: "Provide multiplayer, matchmaking, and leaderboards.",
        s3l3: "Prevent abuse, fraud, and unauthorized access.",
        s3l4: "Verify in-app purchases on Google Play.",
        s3l5: "Improve service stability and game balance.",
        s4h: "4. Legal Basis",
        s4p: "Data is processed to provide the requested service and under legitimate interest for security, abuse prevention, and service maintenance.",
        s5h: "5. Retention",
        s5p: "Data is retained while the account is active. If account deletion is requested, personal data is removed or anonymized within technical processing time.",
        s6h: "6. Data Sharing",
        s6p: "We do not sell personal data. Data may be processed by essential service providers (hosting, database, Google Play Billing, Google Sign-In).",
        s7h: "7. User Rights",
        s7p: "You can request access, rectification, deletion, or restriction of your data by contacting official support.",
        s8h: "8. Account Deletion Request",
        s8p1: "The procedure is available on the ",
        s8p2: " page.",
        s9h: "9. Privacy Contact",
        s9p: "Support email:"
      },
      terms: {
        metaTitle: "Terms and Conditions | ColabGames",
        metaDescription: "Terms and conditions for ChessGuess and ColabGames services.",
        kicker: "LEGAL",
        title: "Terms and Conditions",
        updatedDate: "Last updated: April 9, 2026",
        s1h: "1. Acceptance",
        s1p: "By using ChessGuess, you agree to these terms. If you do not agree, do not use the service.",
        s2h: "2. User Account",
        s2l1: "You are responsible for account security.",
        s2l2: "You must provide accurate information and not impersonate third parties.",
        s2l3: "Accounts may be suspended for abuse or violations.",
        s3h: "3. Conduct",
        s3p: "Cheats, exploits, spam, or attacks against multiplayer services are prohibited and may result in permanent restrictions.",
        s4h: "4. In-App Purchases",
        s4p: "Purchases are managed through third-party platforms (for example Google Play). Refunds and disputes follow platform rules.",
        s5h: "5. Service Availability",
        s5p: "The service may be updated, suspended, or changed for maintenance, security, or product evolution.",
        s6h: "6. Intellectual Property",
        s6p: "Code, brand, design, visual assets, and content belong to ColabGames or their respective owners.",
        s7h: "7. Limitation of Liability",
        s7p: "The service is provided \"as is\" within applicable law. ColabGames is not liable for indirect damages or data loss caused by improper use.",
        s8h: "8. Privacy",
        s8p1: "For data processing details, read the ",
        s8p2: " page.",
        s9h: "9. Contact",
        s9p: "Email:"
      },
      delete: {
        metaTitle: "Delete Account | ColabGames",
        metaDescription: "Official ColabGames instructions to request ChessGuess account deletion.",
        kicker: "ACCOUNT MANAGEMENT",
        title: "Delete Account Request",
        intro: "This page is designed to be used as the account deletion URL in store consoles.",
        howTitle: "How to request deletion",
        howText: "To delete your account go your profile click on settings and click the delete button. Then press confirm.",
        timesTitle: "Timeframe",
        timesP: "Requests are handled within 30 days after requester identity verification.",
        deleteWhatTitle: "What is deleted",
        deleteWhat1: "User account and associated credentials.",
        deleteWhat2: "Player profile, stats, and personal match history linked to the account.",
        deleteWhat3: "Google login association, if present.",
        retainTitle: "What may be retained for technical or legal obligations",
        retain1: "Minimum temporary security logs used for abuse prevention.",
        retain2: "Data required to handle purchase disputes.",
        supportTitle: "Support",
        supportP1: "For questions about this process, visit the ",
        supportP2: " page."
      }
    },
    it: {
      common: {
        menu: "Menu",
        navHome: "Home",
        navChessguess: "ChessGuess",
        navSupport: "Supporto",
        footerPrivacy: "Privacy",
        footerTerms: "Termini",
        footerSupport: "Supporto",
        footerDelete: "Cancella Account",
        langButtonTitle: "Cambia lingua",
        login: "Accedi",
        logout: "Esci",
        register: "Registrati",
        account: "Account",
        username: "Username",
        email: "Email",
        password: "Password",
        oldPassword: "Password attuale",
        newPassword: "Nuova password",
        forgotPassword: "Password dimenticata?",
        loginTitle: "Accedi",
        registerTitle: "Registrati",
        forgotTitle: "Recupera password",
        confirm: "Conferma",
        backToLogin: "Torna al login",
        sendResetLink: "Invia link reset",
        resetPassword: "Reimposta password",
        changePassword: "Cambia password",
        deleteAccountAction: "Elimina account",
        deleteConfirm: "Sei sicuro di voler eliminare l'account? Questa azione e irreversibile.",
        resetSent: "Se l'email esiste, e stato inviato un link di reset.",
        resetPageTitle: "Reimposta Password",
        resetPageButton: "Salva nuova password",
        resetPageSuccess: "Password aggiornata. Ora puoi accedere.",
        resetPageMissingToken: "Link reset non valido o token mancante.",
        loginNoEmail: "Il login usa solo username e password.",
        emailUsage: "L'email serve solo per registrazione e recupero password.",
        authError: "Qualcosa e andato storto. Riprova.",
        authWelcome: "Ciao"
      },
      home: {
        metaTitle: "ColabGames | ChessGuess",
        metaDescription: "ColabGames crea giochi strategici con focus competitivo. Scopri ChessGuess e i link ufficiali.",
        kicker: "INDIE GAME STUDIO",
        title: "ColabGames crea giochi basati su decisioni rapide.",
        lead: "Focus attuale: ChessGuess, gioco strategico a informazione incompleta con bot, stanze private e multiplayer competitivo online.",
        playButton: "Gioca ChessGuess Web",
        appButton: "Pagina gioco",
        linksTitle: "Link Ufficiali",
        linkPrivacy: "Privacy Policy",
        linkTerms: "Termini e Condizioni",
        linkSupport: "Supporto",
        linkDelete: "Cancellazione Account"
      },
      chess: {
        metaTitle: "ChessGuess | ColabGames",
        metaDescription: "Pagina ufficiale ChessGuess con funzioni principali e link alla web app.",
        kicker: "PAGINA GIOCO",
        title: "ChessGuess",
        lead: "Pezzi nascosti, strategia visibile. Leggi il piano avversario prima di vedere ogni pezzo.",
        openWeb: "Apri Web App",
        downloadApk: "Scarica APK Debug",
        featuresTitle: "Funzionalita Principali",
        feature1: "Modalita bot con difficolta progressiva",
        feature2: "Stanze custom con codice condivisibile",
        feature3: "Matchmaking online con rating",
        feature4: "Profilo giocatore con storico partite e avatar sbloccabili",
        feature5: "Login standard e login Google"
      },
      support: {
        metaTitle: "Supporto | ColabGames",
        metaDescription: "Pagina supporto ufficiale ColabGames per ChessGuess: contatti, FAQ e template bug report.",
        kicker: "SUPPORTO",
        title: "Supporto ChessGuess",
        intro: "Usa questi canali per problemi tecnici, account o segnalazioni multiplayer.",
        emailButton: "Email supporto",
        deleteButton: "Delete account",
        contactsTitle: "Contatti",
        emailLabel: "Email:",
        responseTime: "Tempo medio risposta: 2-5 giorni lavorativi",
        languages: "Lingue supportate: Italiano, Inglese, Spagnolo",
        faqTitle: "FAQ Rapida",
        faq1: "Non riesci ad accedere: verifica username/password o login Google.",
        faq2: "Match online non parte: controlla la connessione e riprova matchmaking.",
        faq3: "Problema acquisto supporter: invia ticket con username e ricevuta.",
        templateTitle: "Template Bug Report",
        templateIntro: "Per velocizzare la diagnosi, copia questo formato nella email:",
        templateBody: "Oggetto: Bug report ChessGuess\n\nUsername:\nPiattaforma: Android / Web\nVersione app:\nData e ora del problema:\nDescrizione breve:\nPassi per riprodurre:\nScreenshot o video (se disponibile):"
      },
      privacy: {
        metaTitle: "Privacy Policy | ColabGames",
        metaDescription: "Informativa privacy ufficiale ColabGames per ChessGuess.",
        kicker: "LEGALE",
        title: "Informativa Privacy",
        effectiveDate: "Data efficacia: 9 Aprile 2026",
        s1h: "1. Titolare del Trattamento",
        s1p: "ColabGames e il titolare del trattamento dei dati personali raccolti tramite ChessGuess e servizi online collegati.",
        s2h: "2. Dati Raccolti",
        s2l1: "Dati account: username e credenziali cifrate (hash + salt).",
        s2l2: "Dati login Google: identificativo Google e dati profilo base se usi accesso Google.",
        s2l3: "Dati di gioco: rating, statistiche match, storico partite e avatar sbloccati.",
        s2l4: "Dati tecnici: log di connessione e sicurezza (rate limit, sessioni).",
        s2l5: "Dati acquisti: token acquisto Google Play in forma hash per verifica reward supporter.",
        s3h: "3. Finalita",
        s3l1: "Creare e gestire il tuo account.",
        s3l2: "Fornire multiplayer, matchmaking e leaderboard.",
        s3l3: "Prevenire abusi, frodi e accessi non autorizzati.",
        s3l4: "Verificare acquisti in-app su Google Play.",
        s3l5: "Migliorare stabilita servizio e bilanciamento gioco.",
        s4h: "4. Base Giuridica",
        s4p: "I dati sono trattati per fornire il servizio richiesto e per legittimo interesse legato a sicurezza, prevenzione abusi e manutenzione.",
        s5h: "5. Conservazione",
        s5p: "I dati sono conservati finche l'account e attivo. In caso di cancellazione account, i dati personali vengono rimossi o anonimizzati nei tempi tecnici necessari.",
        s6h: "6. Condivisione Dati",
        s6p: "Non vendiamo dati personali. I dati possono essere trattati da fornitori tecnici essenziali (hosting, database, Google Play Billing, Google Sign-In).",
        s7h: "7. Diritti Utente",
        s7p: "Puoi richiedere accesso, rettifica, cancellazione o limitazione dei tuoi dati contattando il supporto ufficiale.",
        s8h: "8. Richiesta Cancellazione Account",
        s8p1: "La procedura e disponibile nella pagina ",
        s8p2: ".",
        s9h: "9. Contatto Privacy",
        s9p: "Email supporto:"
      },
      terms: {
        metaTitle: "Termini e Condizioni | ColabGames",
        metaDescription: "Termini e condizioni di utilizzo per ChessGuess e servizi ColabGames.",
        kicker: "LEGALE",
        title: "Termini e Condizioni",
        updatedDate: "Ultimo aggiornamento: 9 Aprile 2026",
        s1h: "1. Accettazione",
        s1p: "Usando ChessGuess accetti questi termini. Se non li accetti, non usare il servizio.",
        s2h: "2. Account Utente",
        s2l1: "Sei responsabile della sicurezza del tuo account.",
        s2l2: "Devi fornire informazioni corrette e non impersonare terzi.",
        s2l3: "Gli account possono essere sospesi in caso di abusi o violazioni.",
        s3h: "3. Condotta",
        s3p: "Cheat, exploit, spam o attacchi ai servizi multiplayer sono vietati e possono causare limitazioni permanenti.",
        s4h: "4. Acquisti In-App",
        s4p: "Gli acquisti sono gestiti da piattaforme terze (ad esempio Google Play). Rimborsi e contestazioni seguono le regole della piattaforma.",
        s5h: "5. Disponibilita Servizio",
        s5p: "Il servizio puo essere aggiornato, sospeso o modificato per manutenzione, sicurezza o evoluzione prodotto.",
        s6h: "6. Proprieta Intellettuale",
        s6p: "Codice, brand, design, asset visivi e contenuti appartengono a ColabGames o ai rispettivi titolari.",
        s7h: "7. Limitazione Responsabilita",
        s7p: "Il servizio e fornito \"as is\" nei limiti della normativa applicabile. ColabGames non risponde per danni indiretti o perdita dati da uso improprio.",
        s8h: "8. Privacy",
        s8p1: "Per dettagli sul trattamento dati, consulta la pagina ",
        s8p2: ".",
        s9h: "9. Contatti",
        s9p: "Email:"
      },
      delete: {
        metaTitle: "Delete Account | ColabGames",
        metaDescription: "Istruzioni ufficiali ColabGames per richiedere la cancellazione account ChessGuess.",
        kicker: "GESTIONE ACCOUNT",
        title: "Richiesta Delete Account",
        intro: "Questa pagina e pensata per essere usata come account deletion URL nelle console store.",
        howTitle: "Come richiedere la cancellazione",
        howText: "To delete your account go your profile click on settings and click the delete button. Then press confirm.",
        timesTitle: "Tempi",
        timesP: "Le richieste vengono gestite entro 30 giorni dopo verifica identita del richiedente.",
        deleteWhatTitle: "Cosa viene eliminato",
        deleteWhat1: "Account utente e credenziali associate.",
        deleteWhat2: "Profilo di gioco, statistiche e storico personale collegato all'account.",
        deleteWhat3: "Associazione login Google, se presente.",
        retainTitle: "Cosa puo essere conservato per obblighi tecnici o legali",
        retain1: "Log di sicurezza minimi e temporanei usati per prevenzione abusi.",
        retain2: "Dati necessari a gestire contestazioni sugli acquisti.",
        supportTitle: "Supporto",
        supportP1: "Per domande su questa procedura, visita la pagina ",
        supportP2: "."
      }
    },
    es: {
      common: {
        menu: "Menu",
        navHome: "Inicio",
        navChessguess: "ChessGuess",
        navSupport: "Soporte",
        footerPrivacy: "Privacidad",
        footerTerms: "Terminos",
        footerSupport: "Soporte",
        footerDelete: "Eliminar Cuenta",
        langButtonTitle: "Cambiar idioma",
        login: "Iniciar sesion",
        logout: "Cerrar sesion",
        register: "Registrarse",
        account: "Cuenta",
        username: "Usuario",
        email: "Email",
        password: "Contrasena",
        oldPassword: "Contrasena actual",
        newPassword: "Nueva contrasena",
        forgotPassword: "Olvidaste la contrasena?",
        loginTitle: "Iniciar sesion",
        registerTitle: "Registrarse",
        forgotTitle: "Recuperar contrasena",
        confirm: "Confirmar",
        backToLogin: "Volver al login",
        sendResetLink: "Enviar enlace",
        resetPassword: "Restablecer contrasena",
        changePassword: "Cambiar contrasena",
        deleteAccountAction: "Eliminar cuenta",
        deleteConfirm: "Seguro que quieres eliminar la cuenta? Esta accion no se puede deshacer.",
        resetSent: "Si el email existe, se envio un enlace de recuperacion.",
        resetPageTitle: "Restablecer contrasena",
        resetPageButton: "Guardar nueva contrasena",
        resetPageSuccess: "Contrasena actualizada. Ya puedes iniciar sesion.",
        resetPageMissingToken: "Enlace invalido o token faltante.",
        loginNoEmail: "El login usa solo usuario y contrasena.",
        emailUsage: "El email se usa solo para registro y recuperar contrasena.",
        authError: "Algo salio mal. Intentalo de nuevo.",
        authWelcome: "Hola"
      },
      home: {
        metaTitle: "ColabGames | ChessGuess",
        metaDescription: "ColabGames crea juegos de estrategia con enfoque competitivo. Descubre ChessGuess y enlaces oficiales.",
        kicker: "ESTUDIO INDIE",
        title: "ColabGames crea juegos basados en decisiones rapidas.",
        lead: "Enfoque actual: ChessGuess, juego estrategico de informacion oculta con modo bot, salas privadas y multijugador online competitivo.",
        playButton: "Jugar ChessGuess Web",
        appButton: "Pagina del juego",
        linksTitle: "Enlaces Oficiales",
        linkPrivacy: "Politica de Privacidad",
        linkTerms: "Terminos y Condiciones",
        linkSupport: "Soporte",
        linkDelete: "Eliminar Cuenta"
      },
      chess: {
        metaTitle: "ChessGuess | ColabGames",
        metaDescription: "Pagina oficial de ChessGuess con funciones principales y enlaces a la web app.",
        kicker: "PAGINA DEL JUEGO",
        title: "ChessGuess",
        lead: "Piezas ocultas, estrategia visible. Lee el plan rival antes de ver todas las piezas.",
        openWeb: "Abrir Web App",
        downloadApk: "Descargar APK Debug",
        featuresTitle: "Funciones Principales",
        feature1: "Modo bot con dificultad progresiva",
        feature2: "Salas personalizadas con codigo compartible",
        feature3: "Matchmaking online con rating",
        feature4: "Perfil de jugador con historial de partidas y avatares desbloqueables",
        feature5: "Login estandar y login con Google"
      },
      support: {
        metaTitle: "Soporte | ColabGames",
        metaDescription: "Pagina oficial de soporte ColabGames para ChessGuess: contactos, FAQ rapida y plantilla de bug report.",
        kicker: "SOPORTE",
        title: "Soporte ChessGuess",
        intro: "Usa estos canales para problemas tecnicos, cuenta o reportes de multijugador.",
        emailButton: "Email soporte",
        deleteButton: "Eliminar cuenta",
        contactsTitle: "Contactos",
        emailLabel: "Email:",
        responseTime: "Tiempo medio de respuesta: 2-5 dias habiles",
        languages: "Idiomas soportados: Italiano, Ingles, Espanol",
        faqTitle: "FAQ Rapida",
        faq1: "No puedes iniciar sesion: verifica usuario/contrasena o login Google.",
        faq2: "La partida online no inicia: revisa conexion y reintenta matchmaking.",
        faq3: "Problema con compra supporter: envia ticket con usuario y recibo.",
        templateTitle: "Plantilla Bug Report",
        templateIntro: "Para acelerar el diagnostico, copia este formato en tu email:",
        templateBody: "Asunto: Bug report ChessGuess\n\nUsuario:\nPlataforma: Android / Web\nVersion app:\nFecha y hora del problema:\nDescripcion breve:\nPasos para reproducir:\nCaptura o video (si disponible):"
      },
      privacy: {
        metaTitle: "Politica de Privacidad | ColabGames",
        metaDescription: "Politica oficial de privacidad de ColabGames para ChessGuess.",
        kicker: "LEGAL",
        title: "Politica de Privacidad",
        effectiveDate: "Fecha de vigencia: 9 Abril 2026",
        s1h: "1. Responsable del Tratamiento",
        s1p: "ColabGames es el responsable del tratamiento de datos personales procesados mediante ChessGuess y servicios online relacionados.",
        s2h: "2. Datos que Recopilamos",
        s2l1: "Datos de cuenta: usuario y credenciales cifradas (hash + salt).",
        s2l2: "Datos de login Google: identificador Google y datos basicos de perfil cuando se usa login Google.",
        s2l3: "Datos de juego: rating, estadisticas, historial de partidas y avatares desbloqueados.",
        s2l4: "Datos tecnicos: logs de conexion y seguridad (rate limits, sesiones).",
        s2l5: "Datos de compra: tokens de compra de Google Play en hash para verificar recompensas supporter.",
        s3h: "3. Finalidades",
        s3l1: "Crear y gestionar tu cuenta.",
        s3l2: "Proporcionar multijugador, matchmaking y leaderboard.",
        s3l3: "Prevenir abuso, fraude y accesos no autorizados.",
        s3l4: "Verificar compras in-app en Google Play.",
        s3l5: "Mejorar estabilidad del servicio y balance del juego.",
        s4h: "4. Base Legal",
        s4p: "Los datos se procesan para prestar el servicio solicitado y por interes legitimo en seguridad, prevencion de abuso y mantenimiento.",
        s5h: "5. Conservacion",
        s5p: "Los datos se conservan mientras la cuenta este activa. Si se solicita eliminacion, los datos personales se eliminan o anonimizan en el tiempo tecnico necesario.",
        s6h: "6. Comparticion de Datos",
        s6p: "No vendemos datos personales. Los datos pueden ser tratados por proveedores tecnicos esenciales (hosting, base de datos, Google Play Billing, Google Sign-In).",
        s7h: "7. Derechos del Usuario",
        s7p: "Puedes solicitar acceso, rectificacion, eliminacion o limitacion de tus datos contactando soporte oficial.",
        s8h: "8. Solicitud de Eliminacion de Cuenta",
        s8p1: "El procedimiento esta disponible en la pagina ",
        s8p2: ".",
        s9h: "9. Contacto de Privacidad",
        s9p: "Email soporte:"
      },
      terms: {
        metaTitle: "Terminos y Condiciones | ColabGames",
        metaDescription: "Terminos y condiciones de uso para ChessGuess y servicios ColabGames.",
        kicker: "LEGAL",
        title: "Terminos y Condiciones",
        updatedDate: "Ultima actualizacion: 9 Abril 2026",
        s1h: "1. Aceptacion",
        s1p: "Al usar ChessGuess aceptas estos terminos. Si no estas de acuerdo, no uses el servicio.",
        s2h: "2. Cuenta de Usuario",
        s2l1: "Eres responsable de la seguridad de tu cuenta.",
        s2l2: "Debes proporcionar informacion correcta y no suplantar a terceros.",
        s2l3: "Las cuentas pueden ser suspendidas por abuso o incumplimientos.",
        s3h: "3. Conducta",
        s3p: "Cheats, exploits, spam o ataques contra servicios multijugador estan prohibidos y pueden causar restricciones permanentes.",
        s4h: "4. Compras In-App",
        s4p: "Las compras son gestionadas por plataformas externas (por ejemplo Google Play). Reembolsos y disputas siguen las reglas de la plataforma.",
        s5h: "5. Disponibilidad del Servicio",
        s5p: "El servicio puede actualizarse, suspenderse o modificarse por mantenimiento, seguridad o evolucion del producto.",
        s6h: "6. Propiedad Intelectual",
        s6p: "Codigo, marca, diseno, recursos visuales y contenido pertenecen a ColabGames o a sus respectivos titulares.",
        s7h: "7. Limitacion de Responsabilidad",
        s7p: "El servicio se ofrece \"as is\" dentro de la ley aplicable. ColabGames no responde por danos indirectos o perdida de datos por uso inadecuado.",
        s8h: "8. Privacidad",
        s8p1: "Para detalles de tratamiento de datos, revisa la pagina ",
        s8p2: ".",
        s9h: "9. Contacto",
        s9p: "Email:"
      },
      delete: {
        metaTitle: "Eliminar Cuenta | ColabGames",
        metaDescription: "Instrucciones oficiales de ColabGames para solicitar eliminacion de cuenta ChessGuess.",
        kicker: "GESTION DE CUENTA",
        title: "Solicitud Eliminar Cuenta",
        intro: "Esta pagina esta pensada para usarse como account deletion URL en consolas de store.",
        howTitle: "Como solicitar eliminacion",
        howText: "To delete your account go your profile click on settings and click the delete button. Then press confirm.",
        timesTitle: "Plazos",
        timesP: "Las solicitudes se gestionan dentro de 30 dias despues de verificar la identidad del solicitante.",
        deleteWhatTitle: "Que se elimina",
        deleteWhat1: "Cuenta de usuario y credenciales asociadas.",
        deleteWhat2: "Perfil de juego, estadisticas e historial personal vinculado a la cuenta.",
        deleteWhat3: "Asociacion de login Google, si existe.",
        retainTitle: "Que puede conservarse por obligaciones tecnicas o legales",
        retain1: "Logs minimos temporales de seguridad para prevenir abuso.",
        retain2: "Datos necesarios para gestionar disputas de compras.",
        supportTitle: "Soporte",
        supportP1: "Para dudas sobre este proceso, visita la pagina ",
        supportP2: "."
      }
    }
  };

  function getByPath(source, path) {
    return path.split(".").reduce(function (acc, part) {
      if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
        return acc[part];
      }
      return undefined;
    }, source);
  }

  function translate(lang, key) {
    const direct = getByPath(I18N[lang], key);
    if (typeof direct === "string") {
      return direct;
    }
    const fallback = getByPath(I18N.en, key);
    return typeof fallback === "string" ? fallback : key;
  }

  function safeStoredLang() {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && LANG_ORDER.includes(saved)) {
        return saved;
      }
    } catch (_err) {
      return "en";
    }
    return "en";
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_err) {
      // ignore storage errors
    }
  }

  function applyLanguage(lang) {
    const root = document.documentElement;
    root.lang = lang;
    activeLang = lang;

    const titleKey = root.getAttribute("data-title-key");
    if (titleKey) {
      document.title = translate(lang, titleKey);
    }

    const descriptionKey = root.getAttribute("data-description-key");
    const descriptionNode = document.querySelector("meta[name='description']");
    if (descriptionKey && descriptionNode) {
      descriptionNode.setAttribute("content", translate(lang, descriptionKey));
    }

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      node.textContent = translate(lang, key);
    });

    const langToggle = document.getElementById("lang-toggle");
    if (langToggle) {
      const label = translate(lang, "common.langButtonTitle");
      langToggle.textContent = lang.toUpperCase();
      langToggle.setAttribute("aria-label", label);
      langToggle.setAttribute("title", label);
    }

    syncAuthUiLanguage();
  }

  function setupLanguageToggle(initialLang) {
    const langToggle = document.getElementById("lang-toggle");
    if (!langToggle) {
      return;
    }

    let currentLang = initialLang;

    langToggle.addEventListener("click", function () {
      const currentIndex = LANG_ORDER.indexOf(currentLang);
      const nextLang = LANG_ORDER[(currentIndex + 1) % LANG_ORDER.length];
      currentLang = nextLang;
      storeLang(nextLang);
      applyLanguage(nextLang);
    });
  }

  const authState = {
    user: null
  };

  const authUi = {
    openButton: null,
    welcome: null,
    logoutButton: null,
    modal: null,
    title: null,
    error: null,
    loginView: null,
    registerView: null,
    forgotView: null,
    loginUsername: null,
    loginPassword: null,
    loginAction: null,
    openRegisterAction: null,
    openForgotAction: null,
    registerEmail: null,
    registerUsername: null,
    registerPassword: null,
    registerAction: null,
    registerBackAction: null,
    forgotEmail: null,
    forgotConfirmAction: null,
    forgotBackAction: null
  };

  let authView = "login";

  function authText(key) {
    return translate(activeLang, `common.${key}`);
  }

  function renderAuthState() {
    if (!authUi.openButton || !authUi.welcome || !authUi.logoutButton) {
      return;
    }

    const isAuthenticated = Boolean(authState.user);
    authUi.openButton.hidden = isAuthenticated;
    authUi.welcome.hidden = !isAuthenticated;
    authUi.logoutButton.hidden = !isAuthenticated;
    if (isAuthenticated) {
      authUi.welcome.textContent = `${authText("authWelcome")}, ${authState.user.username}`;
    }
  }

  function clearAuthErrors() {
    if (authUi.error) {
      authUi.error.textContent = "";
    }
  }

  function clearSensitiveInputs() {
    if (authUi.loginPassword) {
      authUi.loginPassword.value = "";
    }
    if (authUi.registerPassword) {
      authUi.registerPassword.value = "";
    }
  }

  function setAuthView(view) {
    authView = view;
    if (!authUi.loginView || !authUi.registerView || !authUi.forgotView) {
      return;
    }
    authUi.loginView.hidden = view !== "login";
    authUi.registerView.hidden = view !== "register";
    authUi.forgotView.hidden = view !== "forgot";
    if (authUi.title) {
      if (view === "register") {
        authUi.title.textContent = authText("registerTitle");
      } else if (view === "forgot") {
        authUi.title.textContent = authText("forgotTitle");
      } else {
        authUi.title.textContent = authText("loginTitle");
      }
    }
  }

  function syncAuthUiLanguage() {
    if (authUi.openButton) {
      authUi.openButton.textContent = authText("login");
    }
    if (authUi.logoutButton) {
      authUi.logoutButton.textContent = authText("logout");
    }
    if (authUi.loginUsername) {
      authUi.loginUsername.placeholder = authText("username");
    }
    if (authUi.loginPassword) {
      authUi.loginPassword.placeholder = authText("password");
    }
    if (authUi.loginAction) {
      authUi.loginAction.textContent = authText("login");
    }
    if (authUi.openRegisterAction) {
      authUi.openRegisterAction.textContent = authText("register");
    }
    if (authUi.openForgotAction) {
      authUi.openForgotAction.textContent = authText("forgotPassword");
    }
    if (authUi.registerEmail) {
      authUi.registerEmail.placeholder = authText("email");
    }
    if (authUi.registerUsername) {
      authUi.registerUsername.placeholder = authText("username");
    }
    if (authUi.registerPassword) {
      authUi.registerPassword.placeholder = authText("password");
    }
    if (authUi.registerAction) {
      authUi.registerAction.textContent = authText("register");
    }
    if (authUi.registerBackAction) {
      authUi.registerBackAction.textContent = authText("backToLogin");
    }
    if (authUi.forgotEmail) {
      authUi.forgotEmail.placeholder = authText("email");
    }
    if (authUi.forgotConfirmAction) {
      authUi.forgotConfirmAction.textContent = authText("confirm");
    }
    if (authUi.forgotBackAction) {
      authUi.forgotBackAction.textContent = authText("backToLogin");
    }
    setAuthView(authView);
    renderAuthState();
  }

  async function authRequest(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload || {})
    });

    const raw = await response.text();
    let data = { ok: false, error: authText("authError") };
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (_err) {
        data = { ok: false, error: `Auth API error (${response.status})` };
      }
    } else if (!response.ok) {
      data = { ok: false, error: `Auth API error (${response.status})` };
    }

    if (!response.ok || !data.ok) {
      throw new Error(typeof data.error === "string" ? data.error : authText("authError"));
    }
    return data;
  }

  async function refreshAuthState() {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      const data = await response.json();
      authState.user = data && data.authenticated ? data.user : null;
    } catch (_err) {
      authState.user = null;
    }
    renderAuthState();
  }

  function openAuthModal(view) {
    if (!authUi.modal) {
      return;
    }
    clearAuthErrors();
    setAuthView(view || "login");
    authUi.modal.hidden = false;
  }

  function closeAuthModal() {
    if (!authUi.modal) {
      return;
    }
    authUi.modal.hidden = true;
    clearAuthErrors();
    clearSensitiveInputs();
  }

  async function submitLogin() {
    clearAuthErrors();
    const username = authUi.loginUsername.value.trim();
    const password = authUi.loginPassword.value;
    if (!username || !password) {
      authUi.error.textContent = authText("authError");
      return;
    }
    try {
      await authRequest("/api/auth/login", { username, password });
      closeAuthModal();
      await refreshAuthState();
    } catch (err) {
      authUi.error.textContent = err.message || authText("authError");
    }
  }

  async function submitRegister() {
    clearAuthErrors();
    const email = authUi.registerEmail.value.trim();
    const username = authUi.registerUsername.value.trim();
    const password = authUi.registerPassword.value;
    if (!email || !username || !password) {
      authUi.error.textContent = authText("authError");
      return;
    }
    try {
      await authRequest("/api/auth/register", { email, username, password });
      closeAuthModal();
      await refreshAuthState();
    } catch (err) {
      authUi.error.textContent = err.message || authText("authError");
    }
  }

  async function submitForgotPassword() {
    clearAuthErrors();
    const email = authUi.forgotEmail.value.trim();
    if (!email) {
      authUi.error.textContent = authText("authError");
      return;
    }
    try {
      await authRequest("/api/auth/forgot-password", { email });
      authUi.error.textContent = authText("resetSent");
    } catch (err) {
      authUi.error.textContent = err.message || authText("authError");
    }
  }

  function buildAuthUi() {
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions) {
      return;
    }

    const authWrap = document.createElement("div");
    authWrap.className = "auth-wrap";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "auth-btn";
    openButton.addEventListener("click", function () {
      openAuthModal("login");
    });

    const welcome = document.createElement("span");
    welcome.className = "auth-welcome";
    welcome.hidden = true;

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "auth-btn";
    logoutButton.hidden = true;
    logoutButton.addEventListener("click", async function () {
      try {
        await authRequest("/api/auth/logout");
      } catch (_err) {
        // ignore logout error and refresh state
      }
      await refreshAuthState();
    });

    authWrap.appendChild(openButton);
    authWrap.appendChild(welcome);
    authWrap.appendChild(logoutButton);
    headerActions.appendChild(authWrap);

    const modal = document.createElement("div");
    modal.className = "auth-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="auth-panel" role="dialog" aria-modal="true">
        <button class="auth-close" type="button" aria-label="Close">X</button>
        <h3 class="auth-title"></h3>
        <div class="auth-section auth-view auth-login-view">
          <input class="auth-input auth-login-username" type="text" maxlength="24" autocomplete="username">
          <input class="auth-input auth-login-password" type="password" maxlength="72" autocomplete="current-password">
          <div class="auth-actions">
            <button class="auth-action auth-login-submit" type="button"></button>
            <button class="auth-action auth-open-register" type="button"></button>
          </div>
          <button class="auth-link auth-open-forgot" type="button"></button>
        </div>
        <div class="auth-section auth-view auth-register-view" hidden>
          <input class="auth-input auth-register-email" type="email" maxlength="120" autocomplete="email">
          <input class="auth-input auth-register-username" type="text" maxlength="24" autocomplete="username">
          <input class="auth-input auth-register-password" type="password" maxlength="72" autocomplete="new-password">
          <div class="auth-actions">
            <button class="auth-action auth-register-submit" type="button"></button>
            <button class="auth-action auth-register-back" type="button"></button>
          </div>
        </div>
        <div class="auth-section auth-view auth-forgot-view" hidden>
          <input class="auth-input auth-forgot-email" type="email" maxlength="120" autocomplete="email">
          <div class="auth-actions">
            <button class="auth-action auth-forgot-confirm" type="button"></button>
            <button class="auth-action auth-forgot-back" type="button"></button>
          </div>
        </div>
        <p class="auth-error" role="alert"></p>
      </div>
    `;

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeAuthModal();
      }
    });

    modal.querySelector(".auth-close").addEventListener("click", closeAuthModal);
    modal.querySelector(".auth-login-submit").addEventListener("click", submitLogin);
    modal.querySelector(".auth-open-register").addEventListener("click", function () {
      clearAuthErrors();
      setAuthView("register");
    });
    modal.querySelector(".auth-open-forgot").addEventListener("click", function () {
      clearAuthErrors();
      setAuthView("forgot");
    });
    modal.querySelector(".auth-register-submit").addEventListener("click", submitRegister);
    modal.querySelector(".auth-register-back").addEventListener("click", function () {
      clearAuthErrors();
      setAuthView("login");
    });
    modal.querySelector(".auth-forgot-confirm").addEventListener("click", submitForgotPassword);
    modal.querySelector(".auth-forgot-back").addEventListener("click", function () {
      clearAuthErrors();
      setAuthView("login");
    });

    document.body.appendChild(modal);

    authUi.openButton = openButton;
    authUi.welcome = welcome;
    authUi.logoutButton = logoutButton;
    authUi.modal = modal;
    authUi.title = modal.querySelector(".auth-title");
    authUi.error = modal.querySelector(".auth-error");
    authUi.loginView = modal.querySelector(".auth-login-view");
    authUi.registerView = modal.querySelector(".auth-register-view");
    authUi.forgotView = modal.querySelector(".auth-forgot-view");
    authUi.loginUsername = modal.querySelector(".auth-login-username");
    authUi.loginPassword = modal.querySelector(".auth-login-password");
    authUi.loginAction = modal.querySelector(".auth-login-submit");
    authUi.openRegisterAction = modal.querySelector(".auth-open-register");
    authUi.openForgotAction = modal.querySelector(".auth-open-forgot");
    authUi.registerEmail = modal.querySelector(".auth-register-email");
    authUi.registerUsername = modal.querySelector(".auth-register-username");
    authUi.registerPassword = modal.querySelector(".auth-register-password");
    authUi.registerAction = modal.querySelector(".auth-register-submit");
    authUi.registerBackAction = modal.querySelector(".auth-register-back");
    authUi.forgotEmail = modal.querySelector(".auth-forgot-email");
    authUi.forgotConfirmAction = modal.querySelector(".auth-forgot-confirm");
    authUi.forgotBackAction = modal.querySelector(".auth-forgot-back");

    syncAuthUiLanguage();
    refreshAuthState();
  }

  function setupResetPasswordPage() {
    const form = document.getElementById("reset-password-form");
    if (!form) {
      return;
    }

    const input = document.getElementById("reset-password-input");
    const submit = document.getElementById("reset-password-submit");
    const message = document.getElementById("reset-password-message");
    const title = document.getElementById("reset-password-title");
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || params.get("reset_token") || "";

    if (title) {
      title.textContent = authText("resetPageTitle");
    }
    if (input) {
      input.placeholder = authText("newPassword");
    }
    if (submit) {
      submit.textContent = authText("resetPageButton");
    }

    if (!token) {
      message.textContent = authText("resetPageMissingToken");
      submit.disabled = true;
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      message.textContent = "";
      const newPassword = input.value;
      if (!newPassword) {
        message.textContent = authText("authError");
        return;
      }
      try {
        await authRequest("/api/auth/reset-password", { token, newPassword });
        message.textContent = authText("resetPageSuccess");
        form.reset();
      } catch (err) {
        message.textContent = err.message || authText("authError");
      }
    });
  }

  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      siteNav.classList.toggle("is-open", !expanded);
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
      });
    });
  }

  const currentPage = document.documentElement.getAttribute("data-page");
  if (currentPage) {
    document.querySelectorAll("[data-nav]").forEach(function (node) {
      if (node.getAttribute("data-nav") === currentPage) {
        node.classList.add("active");
      }
    });
  }

  const yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const initialLang = safeStoredLang();
  applyLanguage(initialLang);
  setupLanguageToggle(initialLang);
  buildAuthUi();
  setupResetPasswordPage();
})();

