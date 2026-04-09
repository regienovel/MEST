# 11 — i18n Strings Dictionary

All user-facing strings in EN and FR. Create `/lib/i18n.ts` with this dictionary.

## Implementation Pattern

```typescript
// /lib/i18n.ts
export type Locale = 'en' | 'fr';

export const translations = {
  en: {
    // ... full dictionary below
  },
  fr: {
    // ... full dictionary below
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, locale: Locale = 'en'): string {
  return translations[locale][key] ?? translations.en[key] ?? key;
}
```

Use a React context + hook for client components:

```typescript
// /lib/i18n-context.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { type Locale, type TranslationKey, t as translate } from './i18n';

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}>({ locale: 'en', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mest-locale') as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('mest-locale', l);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (k) => translate(k, locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
```

## Full Dictionary

```typescript
const en = {
  // Landing page
  'landing.title': 'MEST AI Studio',
  'landing.subtitle': 'A platform for building the AI products West Africa actually needs.',
  'landing.tagline': 'Built for the MEST April 2026 cohort.',
  'landing.login.title': 'Sign in to your team',
  'landing.login.team': 'Team',
  'landing.login.teamPlaceholder': 'Select your team',
  'landing.login.password': 'Password',
  'landing.login.passwordPlaceholder': 'Enter team password',
  'landing.login.button': 'Sign in',
  'landing.login.operator': 'Operator login',
  'landing.login.adminPassword': 'Admin password',
  'landing.login.error': 'Invalid team or password',
  'landing.footer': 'Built in one night with Claude Code. Imagine what you will build.',

  // Studio Home
  'studio.welcome': 'Welcome back',
  'studio.dailyChallenge': 'Today\'s challenge',
  'studio.modules.chat': 'Chat Lab',
  'studio.modules.chat.desc': 'Talk to GPT-4o and Claude. Compare them side-by-side.',
  'studio.modules.voice': 'Voice Lab',
  'studio.modules.voice.desc': 'Speak to AI. Hear it speak back in any voice.',
  'studio.modules.vision': 'Vision Lab',
  'studio.modules.vision.desc': 'Show AI an image. See what it understands.',
  'studio.modules.chain': 'Chain Builder',
  'studio.modules.chain.desc': 'Connect AI steps. Build something impossible.',
  'studio.modules.gallery': 'Gallery',
  'studio.modules.gallery.desc': 'See what other teams are building. Fork their work.',
  'studio.activity.title': 'Live activity',
  'studio.activity.empty': 'Nothing yet. Be the first.',
  'studio.xp': 'XP',
  'studio.logout': 'Logout',

  // Chat Lab
  'chat.title': 'Chat Lab',
  'chat.placeholder': 'Type your message...',
  'chat.send': 'Send',
  'chat.stop': 'Stop',
  'chat.save': 'Save to Gallery',
  'chat.export': 'Export',
  'chat.model.gpt': 'GPT-4o',
  'chat.model.claude': 'Claude Sonnet',
  'chat.model.both': 'Compare Both',
  'chat.systemPrompt': 'System Prompt',
  'chat.systemPrompt.placeholder': 'How should the AI behave?',
  'chat.preset.trader': 'West African market trader',
  'chat.preset.healthWorker': 'Twi-speaking health worker',
  'chat.preset.logistics': 'Francophone logistics coordinator',
  'chat.preset.critic': 'Honest critic',
  'chat.preset.none': 'No preset',
  'chat.thinking': 'Thinking...',
  'chat.error.general': 'Something went wrong. Try again.',
  'chat.error.rateLimit': 'Your team has used its AI calls for this hour. Take a moment, then try again.',
  'chat.error.modelFailed': 'This model is unavailable right now.',
  'chat.temperature': 'Temperature',
  'chat.maxTokens': 'Max tokens',
  'chat.imageAttached': 'Image attached',

  // Voice Lab
  'voice.title': 'Voice Lab',
  'voice.recordStart': 'Click to start recording',
  'voice.recording': 'Recording...',
  'voice.recordStop': 'Click to stop',
  'voice.transcribing': 'Transcribing...',
  'voice.detected': 'Detected',
  'voice.lowConfidence': 'Low confidence — the model may have struggled with this language.',
  'voice.speak': 'Speak this response',
  'voice.speaking': 'Speaking...',
  'voice.uploadAudio': 'Upload audio file',
  'voice.continuousMode': 'Continuous conversation',
  'voice.voice': 'Voice',
  'voice.permissionDenied': 'Microphone permission denied. Please enable it in your browser settings.',
  'voice.tooShort': 'Recording too short. Please record for at least half a second.',

  // Vision Lab
  'vision.title': 'Vision Lab',
  'vision.dropzone': 'Drop image here or click to upload',
  'vision.dropzone.mobile': 'Tap to take a photo or choose an image',
  'vision.promptPlaceholder': 'What do you want to know about this image?',
  'vision.presets': 'Preset prompts',
  'vision.analyze': 'Analyze',
  'vision.analyzing': 'Analyzing image...',
  'vision.preset.products': 'Identify every product visible and estimate prices in local currency',
  'vision.preset.describe': 'Describe what you see in detail',
  'vision.preset.translate': 'Translate every piece of text visible in this image',
  'vision.preset.document': 'Is this a receipt, invoice, or contract? Extract the key information.',
  'vision.preset.crop': 'What can you tell me about the health of this crop or plant?',
  'vision.preset.trade': 'Identify any signs of informal credit, bargaining, or trade relationships',
  'vision.preset.people': 'Describe the people in this image — age, clothing, what they might be doing',
  'vision.preset.numbers': 'Extract all numerical data and format as a table',
  'vision.preset.caption': 'Write a social media caption for this image',
  'vision.preset.custom': '(Custom prompt)',

  // Chain Builder
  'chain.title': 'Chain Builder',
  'chain.name': 'Chain name',
  'chain.namePlaceholder': 'My first chain',
  'chain.run': 'Run Chain',
  'chain.running': 'Running...',
  'chain.save': 'Save',
  'chain.clear': 'Clear',
  'chain.templates': 'Templates',
  'chain.fork': 'Fork existing',
  'chain.blocks.inputs': 'Inputs',
  'chain.blocks.process': 'Process',
  'chain.blocks.outputs': 'Outputs',
  'chain.block.inputText': 'Text Input',
  'chain.block.inputImage': 'Image Upload',
  'chain.block.inputAudio': 'Audio Input',
  'chain.block.chatGpt': 'Ask GPT-4o',
  'chain.block.chatClaude': 'Ask Claude',
  'chain.block.transcribe': 'Transcribe Audio',
  'chain.block.tts': 'Generate Speech',
  'chain.block.visionGpt': 'Vision (GPT)',
  'chain.block.visionClaude': 'Vision (Claude)',
  'chain.block.translate': 'Translate',
  'chain.block.extractJson': 'Extract as JSON',
  'chain.block.summarize': 'Summarize',
  'chain.block.outputText': 'Display Text',
  'chain.block.outputAudio': 'Play Audio',
  'chain.block.outputImage': 'Display Image',
  'chain.status.running': 'Running',
  'chain.status.done': 'Done',
  'chain.status.error': 'Error',
  'chain.empty': 'Add blocks from the left to start building your chain.',
  'chain.executionLog': 'Execution log',

  // Gallery
  'gallery.title': 'Gallery',
  'gallery.filter.all': 'All',
  'gallery.filter.chat': 'Chat',
  'gallery.filter.voice': 'Voice',
  'gallery.filter.vision': 'Vision',
  'gallery.filter.chain': 'Chains',
  'gallery.filter.team': 'All teams',
  'gallery.sort.newest': 'Newest',
  'gallery.sort.views': 'Most viewed',
  'gallery.sort.forks': 'Most forked',
  'gallery.sort.featured': 'Featured',
  'gallery.featured': 'Featured',
  'gallery.fork': 'Fork',
  'gallery.forked': 'Forked',
  'gallery.views': 'views',
  'gallery.forks': 'forks',
  'gallery.empty.title': 'Nothing here yet',
  'gallery.empty.subtitle': 'Be the first team to save something!',
  'gallery.detail.close': 'Close',
  'gallery.detail.copyContent': 'Copy content',

  // Admin
  'admin.title': 'MEST Admin Control',
  'admin.quickStats': 'Quick stats',
  'admin.stats.calls': 'Total calls today',
  'admin.stats.cost': 'Total cost today',
  'admin.stats.topTeam': 'Top team',
  'admin.stats.topModule': 'Top module',
  'admin.liveUsage': 'Live usage',
  'admin.broadcast.title': 'Broadcast message',
  'admin.broadcast.en': 'English message',
  'admin.broadcast.fr': 'French message',
  'admin.broadcast.duration': 'Duration',
  'admin.broadcast.send': 'Broadcast',
  'admin.broadcast.clear': 'Clear',
  'admin.broadcast.active': 'Active broadcast',
  'admin.challenge.title': 'Daily challenge',
  'admin.challenge.update': 'Update challenge',
  'admin.modules.title': 'Modules',
  'admin.teams.title': 'Teams',
  'admin.teams.add': 'Add team',
  'admin.teams.edit': 'Edit',
  'admin.teams.delete': 'Delete',
  'admin.teams.confirmDelete': 'Delete this team? This cannot be undone.',
  'admin.teams.resetXp': 'Reset XP',
  'admin.rateLimit': 'Rate limit (calls per hour)',

  // Common
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.success': 'Success',
  'common.title': 'Title',
  'common.description': 'Description',
  'common.language': 'Language',
} as const;

const fr: typeof en = {
  // Landing page
  'landing.title': 'MEST AI Studio',
  'landing.subtitle': 'Une plateforme pour bâtir les produits IA dont l\'Afrique de l\'Ouest a vraiment besoin.',
  'landing.tagline': 'Conçu pour la cohorte MEST avril 2026.',
  'landing.login.title': 'Connectez-vous à votre équipe',
  'landing.login.team': 'Équipe',
  'landing.login.teamPlaceholder': 'Sélectionnez votre équipe',
  'landing.login.password': 'Mot de passe',
  'landing.login.passwordPlaceholder': 'Entrez le mot de passe de l\'équipe',
  'landing.login.button': 'Se connecter',
  'landing.login.operator': 'Connexion opérateur',
  'landing.login.adminPassword': 'Mot de passe admin',
  'landing.login.error': 'Équipe ou mot de passe invalide',
  'landing.footer': 'Construit en une nuit avec Claude Code. Imaginez ce que vous bâtirez.',

  // Studio Home
  'studio.welcome': 'Bon retour',
  'studio.dailyChallenge': 'Le défi du jour',
  'studio.modules.chat': 'Chat Lab',
  'studio.modules.chat.desc': 'Parlez à GPT-4o et Claude. Comparez-les côte à côte.',
  'studio.modules.voice': 'Voice Lab',
  'studio.modules.voice.desc': 'Parlez à l\'IA. Écoutez-la vous répondre dans n\'importe quelle voix.',
  'studio.modules.vision': 'Vision Lab',
  'studio.modules.vision.desc': 'Montrez une image à l\'IA. Voyez ce qu\'elle comprend.',
  'studio.modules.chain': 'Constructeur de chaîne',
  'studio.modules.chain.desc': 'Connectez des étapes IA. Bâtissez l\'impossible.',
  'studio.modules.gallery': 'Galerie',
  'studio.modules.gallery.desc': 'Voyez ce que les autres équipes construisent. Forkez leur travail.',
  'studio.activity.title': 'Activité en direct',
  'studio.activity.empty': 'Rien pour le moment. Soyez les premiers.',
  'studio.xp': 'XP',
  'studio.logout': 'Déconnexion',

  // Chat Lab
  'chat.title': 'Chat Lab',
  'chat.placeholder': 'Tapez votre message...',
  'chat.send': 'Envoyer',
  'chat.stop': 'Arrêter',
  'chat.save': 'Sauvegarder dans la galerie',
  'chat.export': 'Exporter',
  'chat.model.gpt': 'GPT-4o',
  'chat.model.claude': 'Claude Sonnet',
  'chat.model.both': 'Comparer les deux',
  'chat.systemPrompt': 'Invite système',
  'chat.systemPrompt.placeholder': 'Comment l\'IA doit-elle se comporter ?',
  'chat.preset.trader': 'Commerçant(e) de marché ouest-africain(e)',
  'chat.preset.healthWorker': 'Agent(e) de santé parlant twi',
  'chat.preset.logistics': 'Coordinateur(trice) logistique francophone',
  'chat.preset.critic': 'Critique honnête',
  'chat.preset.none': 'Aucun préréglage',
  'chat.thinking': 'Réflexion en cours...',
  'chat.error.general': 'Quelque chose a mal tourné. Réessayez.',
  'chat.error.rateLimit': 'Votre équipe a utilisé ses appels IA pour cette heure. Prenez une pause, puis réessayez.',
  'chat.error.modelFailed': 'Ce modèle est indisponible pour le moment.',
  'chat.temperature': 'Température',
  'chat.maxTokens': 'Tokens max',
  'chat.imageAttached': 'Image jointe',

  // Voice Lab
  'voice.title': 'Voice Lab',
  'voice.recordStart': 'Cliquez pour commencer l\'enregistrement',
  'voice.recording': 'Enregistrement...',
  'voice.recordStop': 'Cliquez pour arrêter',
  'voice.transcribing': 'Transcription...',
  'voice.detected': 'Détecté',
  'voice.lowConfidence': 'Faible confiance — le modèle a peut-être eu du mal avec cette langue.',
  'voice.speak': 'Lire cette réponse',
  'voice.speaking': 'Lecture...',
  'voice.uploadAudio': 'Téléverser un fichier audio',
  'voice.continuousMode': 'Conversation continue',
  'voice.voice': 'Voix',
  'voice.permissionDenied': 'Permission microphone refusée. Veuillez l\'activer dans les paramètres de votre navigateur.',
  'voice.tooShort': 'Enregistrement trop court. Veuillez enregistrer au moins une demi-seconde.',

  // Vision Lab
  'vision.title': 'Vision Lab',
  'vision.dropzone': 'Déposez l\'image ici ou cliquez pour téléverser',
  'vision.dropzone.mobile': 'Appuyez pour prendre une photo ou choisir une image',
  'vision.promptPlaceholder': 'Que voulez-vous savoir sur cette image ?',
  'vision.presets': 'Invites préréglées',
  'vision.analyze': 'Analyser',
  'vision.analyzing': 'Analyse de l\'image...',
  'vision.preset.products': 'Identifiez tous les produits visibles et estimez les prix en monnaie locale',
  'vision.preset.describe': 'Décrivez ce que vous voyez en détail',
  'vision.preset.translate': 'Traduisez tout texte visible dans cette image',
  'vision.preset.document': 'S\'agit-il d\'un reçu, d\'une facture ou d\'un contrat ? Extrayez les informations clés.',
  'vision.preset.crop': 'Que pouvez-vous me dire sur la santé de cette culture ou plante ?',
  'vision.preset.trade': 'Identifiez tout signe de crédit informel, marchandage ou relations commerciales',
  'vision.preset.people': 'Décrivez les personnes dans cette image — âge, vêtements, ce qu\'elles font peut-être',
  'vision.preset.numbers': 'Extrayez toutes les données numériques et formatez-les sous forme de tableau',
  'vision.preset.caption': 'Rédigez une légende pour réseaux sociaux pour cette image',
  'vision.preset.custom': '(Invite personnalisée)',

  // Chain Builder
  'chain.title': 'Constructeur de chaîne',
  'chain.name': 'Nom de la chaîne',
  'chain.namePlaceholder': 'Ma première chaîne',
  'chain.run': 'Exécuter la chaîne',
  'chain.running': 'Exécution...',
  'chain.save': 'Sauvegarder',
  'chain.clear': 'Effacer',
  'chain.templates': 'Modèles',
  'chain.fork': 'Forker une chaîne existante',
  'chain.blocks.inputs': 'Entrées',
  'chain.blocks.process': 'Traitement',
  'chain.blocks.outputs': 'Sorties',
  'chain.block.inputText': 'Entrée texte',
  'chain.block.inputImage': 'Téléversement d\'image',
  'chain.block.inputAudio': 'Entrée audio',
  'chain.block.chatGpt': 'Demander à GPT-4o',
  'chain.block.chatClaude': 'Demander à Claude',
  'chain.block.transcribe': 'Transcrire l\'audio',
  'chain.block.tts': 'Générer la voix',
  'chain.block.visionGpt': 'Vision (GPT)',
  'chain.block.visionClaude': 'Vision (Claude)',
  'chain.block.translate': 'Traduire',
  'chain.block.extractJson': 'Extraire en JSON',
  'chain.block.summarize': 'Résumer',
  'chain.block.outputText': 'Afficher le texte',
  'chain.block.outputAudio': 'Lire l\'audio',
  'chain.block.outputImage': 'Afficher l\'image',
  'chain.status.running': 'En cours',
  'chain.status.done': 'Terminé',
  'chain.status.error': 'Erreur',
  'chain.empty': 'Ajoutez des blocs depuis la gauche pour commencer à construire votre chaîne.',
  'chain.executionLog': 'Journal d\'exécution',

  // Gallery
  'gallery.title': 'Galerie',
  'gallery.filter.all': 'Tout',
  'gallery.filter.chat': 'Chat',
  'gallery.filter.voice': 'Voix',
  'gallery.filter.vision': 'Vision',
  'gallery.filter.chain': 'Chaînes',
  'gallery.filter.team': 'Toutes les équipes',
  'gallery.sort.newest': 'Plus récent',
  'gallery.sort.views': 'Plus vus',
  'gallery.sort.forks': 'Plus forkés',
  'gallery.sort.featured': 'En vedette',
  'gallery.featured': 'En vedette',
  'gallery.fork': 'Forker',
  'gallery.forked': 'Forké',
  'gallery.views': 'vues',
  'gallery.forks': 'forks',
  'gallery.empty.title': 'Rien ici pour le moment',
  'gallery.empty.subtitle': 'Soyez la première équipe à sauvegarder quelque chose !',
  'gallery.detail.close': 'Fermer',
  'gallery.detail.copyContent': 'Copier le contenu',

  // Admin
  'admin.title': 'Contrôle Admin MEST',
  'admin.quickStats': 'Statistiques rapides',
  'admin.stats.calls': 'Total d\'appels aujourd\'hui',
  'admin.stats.cost': 'Coût total aujourd\'hui',
  'admin.stats.topTeam': 'Meilleure équipe',
  'admin.stats.topModule': 'Meilleur module',
  'admin.liveUsage': 'Utilisation en direct',
  'admin.broadcast.title': 'Message de diffusion',
  'admin.broadcast.en': 'Message en anglais',
  'admin.broadcast.fr': 'Message en français',
  'admin.broadcast.duration': 'Durée',
  'admin.broadcast.send': 'Diffuser',
  'admin.broadcast.clear': 'Effacer',
  'admin.broadcast.active': 'Diffusion active',
  'admin.challenge.title': 'Défi du jour',
  'admin.challenge.update': 'Mettre à jour le défi',
  'admin.modules.title': 'Modules',
  'admin.teams.title': 'Équipes',
  'admin.teams.add': 'Ajouter une équipe',
  'admin.teams.edit': 'Modifier',
  'admin.teams.delete': 'Supprimer',
  'admin.teams.confirmDelete': 'Supprimer cette équipe ? Cette action est irréversible.',
  'admin.teams.resetXp': 'Réinitialiser XP',
  'admin.rateLimit': 'Limite de débit (appels par heure)',

  // Common
  'common.loading': 'Chargement...',
  'common.save': 'Sauvegarder',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.close': 'Fermer',
  'common.confirm': 'Confirmer',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.error': 'Erreur',
  'common.retry': 'Réessayer',
  'common.success': 'Succès',
  'common.title': 'Titre',
  'common.description': 'Description',
  'common.language': 'Langue',
};

export const translations = { en, fr } as const;
```

## Language Toggle Component

Create `/components/studio/language-toggle.tsx`:

```tsx
'use client';
import { useI18n } from '@/lib/i18n-context';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
      className="gap-2"
    >
      <Languages size={16} />
      {locale === 'en' ? 'FR' : 'EN'}
    </Button>
  );
}
```

Place it in the top bar of every `/studio/*` route and on the landing page.
