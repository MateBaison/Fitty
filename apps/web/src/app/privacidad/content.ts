export type Section = { title: string; body: string[] };
export type Policy = {
  heading: string;
  updated: string;
  intro: string;
  sections: Section[];
};
const updated = "31 de octubre de 2026";
export const policies: Record<string, Policy> = {
  es: {
    heading: "Política de privacidad",
    updated: `Última actualización: ${updated}`,
    intro:
      "Fitty es una aplicación para registrar entrenamientos, rutinas y progreso físico, disponible en fitty.uy y como app para iPhone y Android. Esta política explica qué datos tratamos y qué control tenés sobre ellos.",
    sections: [
      {
        title: "Datos que recopilamos",
        body: [
          "Cuenta: tu correo electrónico, o el identificador y correo que nos entrega Google o Apple si iniciás sesión con ellos.",
          "Perfil: nombre, foto, fecha de nacimiento, género, altura, peso, experiencia y objetivos de entrenamiento, idioma y unidades que elijas.",
          "Entrenamiento: rutinas, ejercicios, series, repeticiones, pesos, notas, fotos de entrenamientos y medidas corporales.",
          "Recorridos GPS: si usás el seguimiento de recorridos, la ubicación se obtiene solo mientras la app está abierta y se guarda como parte de tu registro. No usamos ubicación en segundo plano.",
          "Calendario menstrual (opcional): solo si lo activás; son datos de salud que tratamos con especial cuidado.",
          "Soporte: el mensaje y el correo que nos envíes desde el formulario de ayuda.",
        ],
      },
      {
        title: "Para qué los usamos",
        body: [
          "Para mostrarte tu historial, estadísticas y rutinas, y mantenerlos sincronizados entre tus dispositivos.",
          "Para iniciar sesión de forma segura y proteger tu cuenta.",
          "Para responder tus consultas de soporte.",
          "No vendemos tus datos, no mostramos publicidad y no usamos tus datos para crear perfiles publicitarios ni para entrenar modelos de inteligencia artificial.",
        ],
      },
      {
        title: "Dónde se guardan y quién los procesa",
        body: [
          "Tus datos se guardan en Supabase (base de datos y autenticación). El sitio se aloja en Vercel. Los avisos del formulario de soporte se envían con Resend y el correo de soporte se recibe con Zoho.",
          "Estos proveedores tratan los datos solo para prestar el servicio y pueden operar servidores fuera de Uruguay.",
          "También guardamos una copia local en tu dispositivo para que la app funcione sin conexión.",
        ],
      },
      {
        title: "Qué compartimos",
        body: [
          "Solo compartís algo si vos lo decidís, por ejemplo al compartir una rutina o un póster de entrenamiento. Esos contenidos no incluyen tu perfil privado, peso corporal, fotos ni notas.",
          "Podemos revelar datos si una ley o una autoridad competente lo exige.",
        ],
      },
      {
        title: "Cuánto tiempo los conservamos",
        body: [
          "Conservamos tus datos mientras tu cuenta exista. Cuando la eliminás, borramos tu cuenta y tus registros del servicio.",
          "Las copias locales de tus otros dispositivos y las exportaciones que hayas descargado quedan bajo tu control; borralas por tu cuenta si ya no las querés.",
        ],
      },
      {
        title: "Tus derechos y cómo ejercerlos",
        body: [
          "Acceso y copia: en Perfil podés exportar todos tus datos.",
          "Corrección: podés editar tu perfil y tus registros en cualquier momento.",
          "Eliminación: en Perfil > Configuración > Eliminar cuenta borrás tu cuenta y tus datos de forma permanente, tanto en la web como en la app.",
          "Podés escribirnos a soporte@fitty.uy para consultas sobre tus datos. En Uruguay también podés acudir a la Unidad Reguladora y de Control de Datos Personales (URCDP).",
        ],
      },
      {
        title: "Seguridad",
        body: [
          "Usamos conexiones cifradas y controles de acceso para que solo vos puedas leer los datos de tu cuenta. Ningún sistema es completamente infalible, por eso te recomendamos proteger tu dispositivo y tu correo.",
        ],
      },
      {
        title: "Menores",
        body: [
          "Fitty no está dirigida a menores de 14 años y no recopilamos datos de ellos de forma intencional. Si creés que un menor se registró, escribinos para eliminar la cuenta.",
        ],
      },
      {
        title: "Cambios y contacto",
        body: [
          "Si cambiamos esta política publicaremos la nueva versión en esta página con su fecha. Para cualquier duda escribinos a soporte@fitty.uy.",
          "Aviso: Fitty registra información de entrenamiento y no brinda consejos médicos.",
        ],
      },
    ],
  },
  en: {
    heading: "Privacy policy",
    updated: "Last updated: October 31, 2026",
    intro:
      "Fitty is an app for logging workouts, routines and physical progress, available at fitty.uy and as an iPhone and Android app. This policy explains what data we handle and the control you have over it.",
    sections: [
      {
        title: "Data we collect",
        body: [
          "Account: your email address, or the identifier and email Google or Apple give us if you sign in with them.",
          "Profile: name, photo, date of birth, gender, height, weight, training experience and goals, and the language and units you choose.",
          "Training: routines, exercises, sets, repetitions, weights, notes, workout photos and body measurements.",
          "GPS routes: if you use route tracking, location is read only while the app is open and is saved as part of your record. We do not use background location.",
          "Menstrual calendar (optional): only if you turn it on; this is health data and we treat it with extra care.",
          "Support: the message and email you send through the help form.",
        ],
      },
      {
        title: "How we use it",
        body: [
          "To show your history, statistics and routines, and keep them in sync across your devices.",
          "To sign you in securely and protect your account.",
          "To answer your support requests.",
          "We do not sell your data, show ads, build advertising profiles or use your data to train artificial intelligence models.",
        ],
      },
      {
        title: "Where it is stored and who processes it",
        body: [
          "Your data is stored in Supabase (database and authentication). The site is hosted on Vercel. Support form notices are sent with Resend and the support inbox is received with Zoho.",
          "These providers process data only to provide the service and may operate servers outside Uruguay.",
          "We also keep a local copy on your device so the app works offline.",
        ],
      },
      {
        title: "What we share",
        body: [
          "You only share something if you choose to, for example when sharing a routine or a workout poster. Those items do not include your private profile, body weight, photos or notes.",
          "We may disclose data if required by law or by a competent authority.",
        ],
      },
      {
        title: "How long we keep it",
        body: [
          "We keep your data while your account exists. When you delete it, we remove your account and records from the service.",
          "Local copies on your other devices and exports you downloaded stay under your control; delete them yourself if you no longer want them.",
        ],
      },
      {
        title: "Your rights and how to use them",
        body: [
          "Access and copy: in Profile you can export all your data.",
          "Correction: you can edit your profile and records at any time.",
          "Deletion: in Profile > Settings > Delete account you permanently delete your account and data, on both the web and the app.",
          "You can write to soporte@fitty.uy about your data. In Uruguay you can also contact the Personal Data Regulatory and Control Unit (URCDP).",
        ],
      },
      {
        title: "Security",
        body: [
          "We use encrypted connections and access controls so only you can read your account data. No system is completely infallible, so we recommend protecting your device and your email.",
        ],
      },
      {
        title: "Children",
        body: [
          "Fitty is not directed to children under 14 and we do not knowingly collect their data. If you believe a child signed up, write to us and we will delete the account.",
        ],
      },
      {
        title: "Changes and contact",
        body: [
          "If we change this policy we will publish the new version on this page with its date. For any question write to soporte@fitty.uy.",
          "Notice: Fitty records training information and does not provide medical advice.",
        ],
      },
    ],
  },
  fr: {
    heading: "Politique de confidentialité",
    updated: "Dernière mise à jour : 31 octobre 2026",
    intro:
      "Fitty est une application pour enregistrer tes entraînements, tes routines et ta progression physique, disponible sur fitty.uy et en application iPhone et Android. Cette politique explique quelles données nous traitons et quel contrôle tu en as.",
    sections: [
      {
        title: "Données que nous collectons",
        body: [
          "Compte : ton adresse e-mail, ou l'identifiant et l'e-mail que Google ou Apple nous transmettent si tu te connectes avec eux.",
          "Profil : nom, photo, date de naissance, genre, taille, poids, expérience et objectifs d'entraînement, langue et unités choisies.",
          "Entraînement : routines, exercices, séries, répétitions, poids, notes, photos d'entraînement et mensurations.",
          "Parcours GPS : si tu utilises le suivi de parcours, la position n'est lue que lorsque l'application est ouverte et elle est enregistrée avec ton historique. Nous n'utilisons pas la localisation en arrière-plan.",
          "Calendrier menstruel (facultatif) : uniquement si tu l'actives ; ce sont des données de santé que nous traitons avec un soin particulier.",
          "Assistance : le message et l'e-mail que tu envoies depuis le formulaire d'aide.",
        ],
      },
      {
        title: "À quoi nous les utilisons",
        body: [
          "Pour afficher ton historique, tes statistiques et tes routines, et les synchroniser entre tes appareils.",
          "Pour te connecter de façon sûre et protéger ton compte.",
          "Pour répondre à tes demandes d'assistance.",
          "Nous ne vendons pas tes données, nous n'affichons pas de publicité, nous ne créons pas de profils publicitaires et nous n'utilisons pas tes données pour entraîner des modèles d'intelligence artificielle.",
        ],
      },
      {
        title: "Où elles sont stockées et qui les traite",
        body: [
          "Tes données sont stockées chez Supabase (base de données et authentification). Le site est hébergé chez Vercel. Les avis du formulaire d'assistance sont envoyés avec Resend et la boîte d'assistance est reçue via Zoho.",
          "Ces prestataires traitent les données uniquement pour fournir le service et peuvent exploiter des serveurs hors d'Uruguay.",
          "Nous gardons aussi une copie locale sur ton appareil pour que l'application fonctionne hors ligne.",
        ],
      },
      {
        title: "Ce que nous partageons",
        body: [
          "Tu ne partages quelque chose que si tu le décides, par exemple en partageant une routine ou une affiche d'entraînement. Ces contenus n'incluent pas ton profil privé, ton poids, tes photos ni tes notes.",
          "Nous pouvons divulguer des données si la loi ou une autorité compétente l'exige.",
        ],
      },
      {
        title: "Combien de temps nous les conservons",
        body: [
          "Nous conservons tes données tant que ton compte existe. Quand tu le supprimes, nous effaçons ton compte et tes enregistrements du service.",
          "Les copies locales sur tes autres appareils et les exportations que tu as téléchargées restent sous ton contrôle ; supprime-les toi-même si tu n'en veux plus.",
        ],
      },
      {
        title: "Tes droits et comment les exercer",
        body: [
          "Accès et copie : dans Profil, tu peux exporter toutes tes données.",
          "Rectification : tu peux modifier ton profil et tes enregistrements à tout moment.",
          "Suppression : dans Profil > Paramètres > Supprimer le compte, tu supprimes définitivement ton compte et tes données, sur le web comme dans l'application.",
          "Tu peux écrire à soporte@fitty.uy pour toute question sur tes données. En Uruguay, tu peux aussi t'adresser à l'Unité de régulation et de contrôle des données personnelles (URCDP).",
        ],
      },
      {
        title: "Sécurité",
        body: [
          "Nous utilisons des connexions chiffrées et des contrôles d'accès pour que toi seul puisses lire les données de ton compte. Aucun système n'est infaillible ; nous te recommandons donc de protéger ton appareil et ton e-mail.",
        ],
      },
      {
        title: "Mineurs",
        body: [
          "Fitty ne s'adresse pas aux moins de 14 ans et nous ne collectons pas sciemment leurs données. Si tu penses qu'un mineur s'est inscrit, écris-nous et nous supprimerons le compte.",
        ],
      },
      {
        title: "Modifications et contact",
        body: [
          "Si nous modifions cette politique, nous publierons la nouvelle version sur cette page avec sa date. Pour toute question, écris à soporte@fitty.uy.",
          "Avis : Fitty enregistre des informations d'entraînement et ne donne pas de conseils médicaux.",
        ],
      },
    ],
  },
  zh: {
    heading: "隐私政策",
    updated: "最后更新:2026年10月31日",
    intro:
      "Fitty 是一款用于记录训练、计划和身体进步的应用,可在 fitty.uy 使用,也提供 iPhone 和 Android 应用。本政策说明我们处理哪些数据,以及你对这些数据拥有哪些控制权。",
    sections: [
      {
        title: "我们收集的数据",
        body: [
          "账户:你的电子邮箱;如果你使用 Google 或 Apple 登录,则包括它们提供给我们的标识符和邮箱。",
          "个人资料:姓名、照片、出生日期、性别、身高、体重、训练经验和目标,以及你选择的语言和单位。",
          "训练:计划、动作、组数、次数、重量、备注、训练照片和身体测量数据。",
          "GPS 路线:如果你使用路线追踪,仅在应用打开时读取位置,并作为你记录的一部分保存。我们不使用后台定位。",
          "月经日历(可选):仅在你开启时使用;这属于健康数据,我们会格外谨慎地处理。",
          "支持:你通过帮助表单发送的消息和邮箱。",
        ],
      },
      {
        title: "我们如何使用这些数据",
        body: [
          "用于显示你的历史、统计和计划,并在你的设备之间保持同步。",
          "用于安全登录并保护你的账户。",
          "用于回复你的支持请求。",
          "我们不会出售你的数据,不展示广告,不建立广告画像,也不会用你的数据训练人工智能模型。",
        ],
      },
      {
        title: "数据存放位置及处理方",
        body: [
          "你的数据存储在 Supabase(数据库和身份验证)。网站托管在 Vercel。支持表单通知通过 Resend 发送,支持邮箱通过 Zoho 接收。",
          "这些服务商仅为提供服务而处理数据,其服务器可能位于乌拉圭境外。",
          "我们还会在你的设备上保留一份本地副本,使应用可以离线使用。",
        ],
      },
      {
        title: "我们分享什么",
        body: [
          "只有在你主动选择时才会分享内容,例如分享计划或训练海报。这些内容不包含你的私人资料、体重、照片或备注。",
          "如法律或主管机关要求,我们可能会披露数据。",
        ],
      },
      {
        title: "我们保留多久",
        body: [
          "只要你的账户存在,我们就会保留你的数据。你删除账户后,我们会从服务中删除你的账户和记录。",
          "你其他设备上的本地副本以及你下载的导出文件由你自行掌控;如不再需要,请自行删除。",
        ],
      },
      {
        title: "你的权利及行使方式",
        body: [
          "访问和副本:在“个人资料”中可以导出你的全部数据。",
          "更正:你可以随时编辑个人资料和记录。",
          "删除:在“个人资料 > 设置 > 删除账户”中,可永久删除你的账户和数据,网页和应用均可操作。",
          "如对你的数据有疑问,可发邮件至 soporte@fitty.uy。在乌拉圭,你也可以联系个人数据监管与控制机构(URCDP)。",
        ],
      },
      {
        title: "安全",
        body: [
          "我们使用加密连接和访问控制,确保只有你能读取账户数据。没有任何系统是绝对万无一失的,因此建议你保护好设备和邮箱。",
        ],
      },
      {
        title: "未成年人",
        body: [
          "Fitty 不面向 14 岁以下的儿童,我们也不会有意收集其数据。如果你认为有未成年人注册,请联系我们,我们将删除该账户。",
        ],
      },
      {
        title: "变更与联系",
        body: [
          "如果我们更改本政策,会在此页面发布新版本并标明日期。如有任何疑问,请发邮件至 soporte@fitty.uy。",
          "提示:Fitty 记录训练信息,不提供医疗建议。",
        ],
      },
    ],
  },
  hi: {
    heading: "गोपनीयता नीति",
    updated: "अंतिम अपडेट: 31 अक्टूबर 2026",
    intro:
      "Fitty वर्कआउट, रूटीन और शारीरिक प्रगति दर्ज करने वाला ऐप है, जो fitty.uy पर और iPhone व Android ऐप के रूप में उपलब्ध है। यह नीति बताती है कि हम कौन-सा डेटा संभालते हैं और उस पर आपका क्या नियंत्रण है।",
    sections: [
      {
        title: "हम कौन-सा डेटा एकत्र करते हैं",
        body: [
          "खाता: आपका ईमेल पता, या Google या Apple से साइन इन करने पर वे जो पहचान और ईमेल हमें देते हैं।",
          "प्रोफ़ाइल: नाम, फ़ोटो, जन्म तिथि, लिंग, कद, वज़न, प्रशिक्षण का अनुभव और लक्ष्य, तथा आपकी चुनी हुई भाषा और इकाइयाँ।",
          "प्रशिक्षण: रूटीन, व्यायाम, सेट, दोहराव, वज़न, नोट्स, वर्कआउट की फ़ोटो और शरीर के माप।",
          "GPS रूट: यदि आप रूट ट्रैकिंग का उपयोग करते हैं, तो स्थान केवल तब पढ़ा जाता है जब ऐप खुला हो और वह आपके रिकॉर्ड का हिस्सा बनकर सहेजा जाता है। हम बैकग्राउंड लोकेशन का उपयोग नहीं करते।",
          "मासिक धर्म कैलेंडर (वैकल्पिक): केवल तभी जब आप इसे चालू करें; यह स्वास्थ्य डेटा है और हम इसे विशेष सावधानी से संभालते हैं।",
          "सहायता: आप सहायता फ़ॉर्म से जो संदेश और ईमेल भेजते हैं।",
        ],
      },
      {
        title: "हम इसका उपयोग कैसे करते हैं",
        body: [
          "आपका इतिहास, आँकड़े और रूटीन दिखाने और उन्हें आपके उपकरणों में सिंक रखने के लिए।",
          "सुरक्षित रूप से साइन इन कराने और आपके खाते की सुरक्षा के लिए।",
          "आपके सहायता अनुरोधों का उत्तर देने के लिए।",
          "हम आपका डेटा नहीं बेचते, विज्ञापन नहीं दिखाते, विज्ञापन प्रोफ़ाइल नहीं बनाते और आपके डेटा से कृत्रिम बुद्धिमत्ता मॉडल प्रशिक्षित नहीं करते।",
        ],
      },
      {
        title: "डेटा कहाँ रखा जाता है और कौन संसाधित करता है",
        body: [
          "आपका डेटा Supabase (डेटाबेस और प्रमाणीकरण) में रखा जाता है। साइट Vercel पर होस्ट है। सहायता फ़ॉर्म की सूचनाएँ Resend से भेजी जाती हैं और सहायता इनबॉक्स Zoho से प्राप्त होता है।",
          "ये प्रदाता केवल सेवा देने के लिए डेटा संसाधित करते हैं और उनके सर्वर उरुग्वे के बाहर हो सकते हैं।",
          "ऐप बिना इंटरनेट के भी चल सके, इसके लिए हम आपके उपकरण पर एक स्थानीय प्रति भी रखते हैं।",
        ],
      },
      {
        title: "हम क्या साझा करते हैं",
        body: [
          "आप केवल वही साझा करते हैं जो आप चुनते हैं, जैसे कोई रूटीन या वर्कआउट पोस्टर। इनमें आपकी निजी प्रोफ़ाइल, शारीरिक वज़न, फ़ोटो या नोट्स शामिल नहीं होते।",
          "कानून या सक्षम प्राधिकारी की माँग पर हमें डेटा बताना पड़ सकता है।",
        ],
      },
      {
        title: "हम इसे कितने समय तक रखते हैं",
        body: [
          "जब तक आपका खाता है, हम आपका डेटा रखते हैं। खाता हटाने पर हम सेवा से आपका खाता और रिकॉर्ड हटा देते हैं।",
          "आपके अन्य उपकरणों की स्थानीय प्रतियाँ और डाउनलोड की गई एक्सपोर्ट फ़ाइलें आपके नियंत्रण में रहती हैं; ज़रूरत न हो तो उन्हें स्वयं हटा दें।",
        ],
      },
      {
        title: "आपके अधिकार और उनका उपयोग",
        body: [
          "पहुँच और प्रति: प्रोफ़ाइल में आप अपना सारा डेटा एक्सपोर्ट कर सकते हैं।",
          "सुधार: आप कभी भी अपनी प्रोफ़ाइल और रिकॉर्ड संपादित कर सकते हैं।",
          "हटाना: प्रोफ़ाइल > सेटिंग > खाता हटाएँ में आप वेब और ऐप दोनों पर अपना खाता और डेटा स्थायी रूप से हटा सकते हैं।",
          "अपने डेटा के बारे में आप soporte@fitty.uy पर लिख सकते हैं। उरुग्वे में आप व्यक्तिगत डेटा नियामक एवं नियंत्रण इकाई (URCDP) से भी संपर्क कर सकते हैं।",
        ],
      },
      {
        title: "सुरक्षा",
        body: [
          "हम एन्क्रिप्टेड कनेक्शन और एक्सेस नियंत्रण का उपयोग करते हैं ताकि केवल आप अपने खाते का डेटा पढ़ सकें। कोई भी प्रणाली पूरी तरह दोषरहित नहीं होती, इसलिए अपने उपकरण और ईमेल को सुरक्षित रखें।",
        ],
      },
      {
        title: "नाबालिग",
        body: [
          "Fitty 14 वर्ष से कम उम्र के बच्चों के लिए नहीं है और हम जानबूझकर उनका डेटा एकत्र नहीं करते। यदि आपको लगता है कि किसी नाबालिग ने साइन अप किया है, तो हमें लिखें और हम खाता हटा देंगे।",
        ],
      },
      {
        title: "बदलाव और संपर्क",
        body: [
          "यदि हम इस नीति में बदलाव करेंगे, तो नया संस्करण तारीख के साथ इसी पृष्ठ पर प्रकाशित करेंगे। किसी भी प्रश्न के लिए soporte@fitty.uy पर लिखें।",
          "सूचना: Fitty प्रशिक्षण की जानकारी दर्ज करता है और चिकित्सीय सलाह नहीं देता।",
        ],
      },
    ],
  },
  ar: {
    heading: "سياسة الخصوصية",
    updated: "آخر تحديث: 31 أكتوبر 2026",
    intro:
      "Fitty تطبيق لتسجيل التمارين والروتينات والتقدم البدني، متاح على fitty.uy وكتطبيق لـ iPhone وAndroid. توضح هذه السياسة البيانات التي نعالجها ومقدار التحكم الذي تملكه عليها.",
    sections: [
      {
        title: "البيانات التي نجمعها",
        body: [
          "الحساب: بريدك الإلكتروني، أو المعرّف والبريد اللذان تزودنا بهما Google أو Apple إذا سجلت الدخول عبرهما.",
          "الملف الشخصي: الاسم والصورة وتاريخ الميلاد والجنس والطول والوزن وخبرة التدريب وأهدافه واللغة والوحدات التي تختارها.",
          "التدريب: الروتينات والتمارين والمجموعات والتكرارات والأوزان والملاحظات وصور التمارين وقياسات الجسم.",
          "مسارات GPS: إذا استخدمت تتبع المسارات، تُقرأ الموقع فقط أثناء فتح التطبيق وتُحفظ ضمن سجلك. لا نستخدم الموقع في الخلفية.",
          "تقويم الدورة الشهرية (اختياري): فقط إذا فعّلته؛ وهي بيانات صحية نعاملها بعناية خاصة.",
          "الدعم: الرسالة والبريد اللذان ترسلهما من نموذج المساعدة.",
        ],
      },
      {
        title: "كيف نستخدمها",
        body: [
          "لعرض سجلك وإحصاءاتك وروتيناتك ومزامنتها بين أجهزتك.",
          "لتسجيل دخولك بأمان وحماية حسابك.",
          "للرد على طلبات الدعم الخاصة بك.",
          "لا نبيع بياناتك ولا نعرض إعلانات ولا ننشئ ملفات إعلانية ولا نستخدم بياناتك لتدريب نماذج الذكاء الاصطناعي.",
        ],
      },
      {
        title: "أين تُخزَّن ومن يعالجها",
        body: [
          "تُخزَّن بياناتك في Supabase (قاعدة البيانات والمصادقة). يُستضاف الموقع على Vercel. تُرسل إشعارات نموذج الدعم عبر Resend ويُستلم بريد الدعم عبر Zoho.",
          "يعالج هؤلاء المزودون البيانات فقط لتقديم الخدمة وقد تكون خوادمهم خارج أوروغواي.",
          "نحتفظ أيضًا بنسخة محلية على جهازك ليعمل التطبيق دون اتصال.",
        ],
      },
      {
        title: "ما الذي نشاركه",
        body: [
          "لا تشارك شيئًا إلا إذا اخترت ذلك، مثل مشاركة روتين أو ملصق تمرين. لا تتضمن هذه المحتويات ملفك الشخصي الخاص أو وزن جسمك أو صورك أو ملاحظاتك.",
          "قد نكشف عن البيانات إذا طلب القانون أو جهة مختصة ذلك.",
        ],
      },
      {
        title: "مدة الاحتفاظ بها",
        body: [
          "نحتفظ ببياناتك ما دام حسابك موجودًا. عند حذفه نزيل حسابك وسجلاتك من الخدمة.",
          "تبقى النسخ المحلية على أجهزتك الأخرى والتصديرات التي نزّلتها تحت سيطرتك؛ احذفها بنفسك إن لم تعد تريدها.",
        ],
      },
      {
        title: "حقوقك وكيفية ممارستها",
        body: [
          "الوصول والنسخة: يمكنك من الملف الشخصي تصدير جميع بياناتك.",
          "التصحيح: يمكنك تعديل ملفك وسجلاتك في أي وقت.",
          "الحذف: من الملف الشخصي > الإعدادات > حذف الحساب تحذف حسابك وبياناتك نهائيًا، على الويب وفي التطبيق.",
          "يمكنك مراسلتنا على soporte@fitty.uy بخصوص بياناتك. وفي أوروغواي يمكنك أيضًا التواصل مع وحدة تنظيم ومراقبة البيانات الشخصية (URCDP).",
        ],
      },
      {
        title: "الأمان",
        body: [
          "نستخدم اتصالات مشفّرة وضوابط وصول حتى لا يقرأ بيانات حسابك سواك. لا يوجد نظام معصوم تمامًا، لذا ننصحك بحماية جهازك وبريدك.",
        ],
      },
      {
        title: "القاصرون",
        body: [
          "Fitty غير موجّه للأطفال دون 14 عامًا ولا نجمع بياناتهم عن قصد. إذا كنت تعتقد أن قاصرًا سجّل، فراسلنا وسنحذف الحساب.",
        ],
      },
      {
        title: "التغييرات والتواصل",
        body: [
          "إذا غيّرنا هذه السياسة سننشر النسخة الجديدة في هذه الصفحة مع تاريخها. لأي استفسار راسلنا على soporte@fitty.uy.",
          "تنبيه: يسجّل Fitty معلومات التدريب ولا يقدّم نصائح طبية.",
        ],
      },
    ],
  },
  de: {
    heading: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: 31. Oktober 2026",
    intro:
      "Fitty ist eine App zum Erfassen von Trainings, Routinen und körperlichem Fortschritt, verfügbar auf fitty.uy sowie als App für iPhone und Android. Diese Erklärung beschreibt, welche Daten wir verarbeiten und welche Kontrolle du darüber hast.",
    sections: [
      {
        title: "Welche Daten wir erheben",
        body: [
          "Konto: deine E-Mail-Adresse oder die Kennung und E-Mail, die uns Google oder Apple übermitteln, wenn du dich damit anmeldest.",
          "Profil: Name, Foto, Geburtsdatum, Geschlecht, Größe, Gewicht, Trainingserfahrung und -ziele sowie die von dir gewählte Sprache und Einheiten.",
          "Training: Routinen, Übungen, Sätze, Wiederholungen, Gewichte, Notizen, Trainingsfotos und Körpermaße.",
          "GPS-Strecken: Wenn du die Streckenaufzeichnung nutzt, wird der Standort nur gelesen, solange die App geöffnet ist, und als Teil deines Eintrags gespeichert. Wir nutzen keinen Standort im Hintergrund.",
          "Menstruationskalender (optional): nur, wenn du ihn aktivierst; das sind Gesundheitsdaten, die wir besonders sorgfältig behandeln.",
          "Support: die Nachricht und E-Mail, die du über das Hilfeformular sendest.",
        ],
      },
      {
        title: "Wofür wir sie nutzen",
        body: [
          "Um deinen Verlauf, deine Statistiken und Routinen anzuzeigen und auf deinen Geräten synchron zu halten.",
          "Um dich sicher anzumelden und dein Konto zu schützen.",
          "Um deine Supportanfragen zu beantworten.",
          "Wir verkaufen deine Daten nicht, zeigen keine Werbung, erstellen keine Werbeprofile und nutzen deine Daten nicht zum Training von KI-Modellen.",
        ],
      },
      {
        title: "Wo sie gespeichert werden und wer sie verarbeitet",
        body: [
          "Deine Daten werden bei Supabase (Datenbank und Authentifizierung) gespeichert. Die Website wird bei Vercel gehostet. Benachrichtigungen des Supportformulars werden mit Resend versendet, das Support-Postfach wird über Zoho empfangen.",
          "Diese Anbieter verarbeiten Daten nur zur Erbringung des Dienstes und können Server außerhalb Uruguays betreiben.",
          "Außerdem speichern wir eine lokale Kopie auf deinem Gerät, damit die App offline funktioniert.",
        ],
      },
      {
        title: "Was wir teilen",
        body: [
          "Du teilst nur etwas, wenn du es selbst entscheidest, zum Beispiel beim Teilen einer Routine oder eines Trainingsposters. Diese Inhalte enthalten weder dein privates Profil noch Körpergewicht, Fotos oder Notizen.",
          "Wir können Daten offenlegen, wenn ein Gesetz oder eine zuständige Behörde es verlangt.",
        ],
      },
      {
        title: "Wie lange wir sie aufbewahren",
        body: [
          "Wir bewahren deine Daten auf, solange dein Konto besteht. Wenn du es löschst, entfernen wir dein Konto und deine Einträge aus dem Dienst.",
          "Lokale Kopien auf deinen anderen Geräten und heruntergeladene Exporte bleiben in deiner Hand; lösche sie selbst, wenn du sie nicht mehr möchtest.",
        ],
      },
      {
        title: "Deine Rechte und wie du sie ausübst",
        body: [
          "Auskunft und Kopie: Im Profil kannst du alle deine Daten exportieren.",
          "Berichtigung: Du kannst dein Profil und deine Einträge jederzeit bearbeiten.",
          "Löschung: Unter Profil > Einstellungen > Konto löschen löschst du dein Konto und deine Daten dauerhaft, im Web wie in der App.",
          "Bei Fragen zu deinen Daten schreib an soporte@fitty.uy. In Uruguay kannst du dich außerdem an die Aufsichtsbehörde für personenbezogene Daten (URCDP) wenden.",
        ],
      },
      {
        title: "Sicherheit",
        body: [
          "Wir verwenden verschlüsselte Verbindungen und Zugriffskontrollen, damit nur du die Daten deines Kontos lesen kannst. Kein System ist völlig fehlerfrei; schütze daher dein Gerät und deine E-Mail.",
        ],
      },
      {
        title: "Minderjährige",
        body: [
          "Fitty richtet sich nicht an Kinder unter 14 Jahren und wir erheben ihre Daten nicht wissentlich. Wenn du glaubst, dass sich ein Minderjähriger registriert hat, schreib uns und wir löschen das Konto.",
        ],
      },
      {
        title: "Änderungen und Kontakt",
        body: [
          "Wenn wir diese Erklärung ändern, veröffentlichen wir die neue Fassung mit Datum auf dieser Seite. Bei Fragen schreib an soporte@fitty.uy.",
          "Hinweis: Fitty erfasst Trainingsinformationen und gibt keine medizinische Beratung.",
        ],
      },
    ],
  },
  it: {
    heading: "Informativa sulla privacy",
    updated: "Ultimo aggiornamento: 31 ottobre 2026",
    intro:
      "Fitty è un'app per registrare allenamenti, routine e progressi fisici, disponibile su fitty.uy e come app per iPhone e Android. Questa informativa spiega quali dati trattiamo e quale controllo hai su di essi.",
    sections: [
      {
        title: "Dati che raccogliamo",
        body: [
          "Account: il tuo indirizzo e-mail, oppure l'identificativo e l'e-mail che Google o Apple ci forniscono se accedi con loro.",
          "Profilo: nome, foto, data di nascita, genere, altezza, peso, esperienza e obiettivi di allenamento, lingua e unità che scegli.",
          "Allenamento: routine, esercizi, serie, ripetizioni, pesi, note, foto degli allenamenti e misure corporee.",
          "Percorsi GPS: se usi il tracciamento dei percorsi, la posizione viene letta solo mentre l'app è aperta e salvata come parte del tuo registro. Non usiamo la posizione in background.",
          "Calendario mestruale (facoltativo): solo se lo attivi; sono dati sulla salute che trattiamo con particolare cura.",
          "Assistenza: il messaggio e l'e-mail che invii dal modulo di aiuto.",
        ],
      },
      {
        title: "Come li usiamo",
        body: [
          "Per mostrarti cronologia, statistiche e routine e mantenerle sincronizzate tra i tuoi dispositivi.",
          "Per farti accedere in modo sicuro e proteggere il tuo account.",
          "Per rispondere alle tue richieste di assistenza.",
          "Non vendiamo i tuoi dati, non mostriamo pubblicità, non creiamo profili pubblicitari e non usiamo i tuoi dati per addestrare modelli di intelligenza artificiale.",
        ],
      },
      {
        title: "Dove sono conservati e chi li tratta",
        body: [
          "I tuoi dati sono conservati su Supabase (database e autenticazione). Il sito è ospitato su Vercel. Gli avvisi del modulo di assistenza sono inviati con Resend e la casella di assistenza è ricevuta tramite Zoho.",
          "Questi fornitori trattano i dati solo per erogare il servizio e possono gestire server fuori dall'Uruguay.",
          "Conserviamo anche una copia locale sul tuo dispositivo per far funzionare l'app offline.",
        ],
      },
      {
        title: "Cosa condividiamo",
        body: [
          "Condividi qualcosa solo se lo decidi tu, ad esempio condividendo una routine o un poster dell'allenamento. Questi contenuti non includono il tuo profilo privato, il peso corporeo, le foto né le note.",
          "Possiamo comunicare dati se lo richiede una legge o un'autorità competente.",
        ],
      },
      {
        title: "Per quanto tempo li conserviamo",
        body: [
          "Conserviamo i tuoi dati finché il tuo account esiste. Quando lo elimini, rimuoviamo il tuo account e i tuoi registri dal servizio.",
          "Le copie locali sugli altri tuoi dispositivi e le esportazioni scaricate restano sotto il tuo controllo; eliminale tu stesso se non le vuoi più.",
        ],
      },
      {
        title: "I tuoi diritti e come esercitarli",
        body: [
          "Accesso e copia: in Profilo puoi esportare tutti i tuoi dati.",
          "Rettifica: puoi modificare in qualsiasi momento il tuo profilo e i tuoi registri.",
          "Cancellazione: in Profilo > Impostazioni > Elimina account elimini in modo permanente il tuo account e i tuoi dati, sia sul web sia nell'app.",
          "Puoi scrivere a soporte@fitty.uy per domande sui tuoi dati. In Uruguay puoi anche rivolgerti all'Unità di regolamentazione e controllo dei dati personali (URCDP).",
        ],
      },
      {
        title: "Sicurezza",
        body: [
          "Usiamo connessioni cifrate e controlli di accesso affinché solo tu possa leggere i dati del tuo account. Nessun sistema è infallibile, quindi ti consigliamo di proteggere il dispositivo e la tua e-mail.",
        ],
      },
      {
        title: "Minori",
        body: [
          "Fitty non è rivolta a minori di 14 anni e non raccogliamo consapevolmente i loro dati. Se pensi che un minore si sia registrato, scrivici e cancelleremo l'account.",
        ],
      },
      {
        title: "Modifiche e contatti",
        body: [
          "Se modifichiamo questa informativa, pubblicheremo la nuova versione in questa pagina con la data. Per qualsiasi dubbio scrivi a soporte@fitty.uy.",
          "Avviso: Fitty registra informazioni sull'allenamento e non fornisce consigli medici.",
        ],
      },
    ],
  },
  pt: {
    heading: "Política de privacidade",
    updated: "Última atualização: 31 de outubro de 2026",
    intro:
      "O Fitty é um aplicativo para registrar treinos, rotinas e progresso físico, disponível em fitty.uy e como app para iPhone e Android. Esta política explica quais dados tratamos e que controle você tem sobre eles.",
    sections: [
      {
        title: "Dados que coletamos",
        body: [
          "Conta: seu e-mail, ou o identificador e o e-mail que o Google ou a Apple nos fornecem se você entrar com eles.",
          "Perfil: nome, foto, data de nascimento, gênero, altura, peso, experiência e objetivos de treino, além do idioma e das unidades que você escolher.",
          "Treino: rotinas, exercícios, séries, repetições, pesos, anotações, fotos de treinos e medidas corporais.",
          "Percursos GPS: se você usar o rastreamento de percursos, a localização é lida apenas com o app aberto e salva como parte do seu registro. Não usamos localização em segundo plano.",
          "Calendário menstrual (opcional): somente se você ativar; são dados de saúde que tratamos com cuidado especial.",
          "Suporte: a mensagem e o e-mail que você enviar pelo formulário de ajuda.",
        ],
      },
      {
        title: "Para que os usamos",
        body: [
          "Para mostrar seu histórico, estatísticas e rotinas e mantê-los sincronizados entre seus dispositivos.",
          "Para fazer seu login com segurança e proteger sua conta.",
          "Para responder às suas solicitações de suporte.",
          "Não vendemos seus dados, não exibimos publicidade, não criamos perfis publicitários e não usamos seus dados para treinar modelos de inteligência artificial.",
        ],
      },
      {
        title: "Onde ficam armazenados e quem os processa",
        body: [
          "Seus dados ficam no Supabase (banco de dados e autenticação). O site é hospedado na Vercel. Os avisos do formulário de suporte são enviados com o Resend e a caixa de suporte é recebida pelo Zoho.",
          "Esses provedores tratam os dados apenas para prestar o serviço e podem operar servidores fora do Uruguai.",
          "Também mantemos uma cópia local no seu dispositivo para que o app funcione offline.",
        ],
      },
      {
        title: "O que compartilhamos",
        body: [
          "Você só compartilha algo se decidir, por exemplo ao compartilhar uma rotina ou um pôster de treino. Esses conteúdos não incluem seu perfil privado, peso corporal, fotos nem anotações.",
          "Podemos divulgar dados se a lei ou uma autoridade competente exigir.",
        ],
      },
      {
        title: "Por quanto tempo os mantemos",
        body: [
          "Mantemos seus dados enquanto sua conta existir. Quando você a exclui, removemos sua conta e seus registros do serviço.",
          "As cópias locais em seus outros dispositivos e as exportações que você baixou ficam sob seu controle; exclua-as por conta própria se não as quiser mais.",
        ],
      },
      {
        title: "Seus direitos e como exercê-los",
        body: [
          "Acesso e cópia: em Perfil você pode exportar todos os seus dados.",
          "Correção: você pode editar seu perfil e seus registros a qualquer momento.",
          "Exclusão: em Perfil > Configurações > Excluir conta você apaga sua conta e seus dados de forma permanente, tanto na web quanto no app.",
          "Você pode escrever para soporte@fitty.uy sobre seus dados. No Uruguai, também pode procurar a Unidade Reguladora e de Controle de Dados Pessoais (URCDP).",
        ],
      },
      {
        title: "Segurança",
        body: [
          "Usamos conexões criptografadas e controles de acesso para que só você possa ler os dados da sua conta. Nenhum sistema é totalmente infalível, por isso recomendamos proteger seu dispositivo e seu e-mail.",
        ],
      },
      {
        title: "Menores",
        body: [
          "O Fitty não se destina a menores de 14 anos e não coletamos dados deles de forma intencional. Se você acredita que um menor se cadastrou, escreva para nós e excluiremos a conta.",
        ],
      },
      {
        title: "Alterações e contato",
        body: [
          "Se mudarmos esta política, publicaremos a nova versão nesta página com a data. Para qualquer dúvida, escreva para soporte@fitty.uy.",
          "Aviso: o Fitty registra informações de treino e não oferece aconselhamento médico.",
        ],
      },
    ],
  },
};
