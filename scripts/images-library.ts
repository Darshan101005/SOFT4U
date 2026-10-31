/**
 * Builds the reusable image library on Cloudinary so the admin can pick a
 * ready logo for a new product ("type hotstar, get the Hotstar logo").
 *
 *   bun run images:library                  logos + category icons
 *   bun run images:library --only=library   brand logos only   (SOFT4U/library)
 *   bun run images:library --only=icons     3D category icons  (SOFT4U/categories)
 *   bun run images:library --dry            resolve sources, upload nothing
 *   bun run images:library --force          re-upload items that already exist
 *   bun run images:library --force-icons    re-assign icons even to categories the admin changed
 *
 * Re-runnable: an item whose tag `lib:<slug>` / `icon:<slug>` is already in
 * media_library is skipped. Every image goes through the shared catalogue
 * pipeline (processCatalogueImage: trim, fit 448, centred 512x512 PNG).
 *
 * Sources
 *  - Brand logos: Wikimedia Commons (official logo files), falling back to the
 *    App Store icon (rounded corners) when Commons has no usable file.
 *  - Category icons: Microsoft Fluent Emoji 3D PNGs (MIT licence,
 *    github.com/microsoft/fluentui-emoji).
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { db, getPool } from '../lib/db';
import { cloudinaryEnabled, processCatalogueImage } from '../lib/cloudinary';

const UA = 'Soft4u/1.0 (https://soft4u.top; support@soft4u.top)';
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const FORCE_ICONS = args.includes('--force-icons');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || 'all';

/* ------------------------------------------------------------------ */
/* Brand list                                                          */
/* ------------------------------------------------------------------ */

interface Brand {
  name: string;
  group: string;
  /** Commons search term (default: name). */
  q?: string;
  /** Words that must appear in the Commons file title (default: words of q). */
  match?: string[];
  /** Exact Commons file title to try first. */
  file?: string;
  /** App Store search term for the fallback (default: name). */
  app?: string;
  /** App Store country for the fallback. */
  country?: string;
  /** Use the App Store icon first. */
  preferApp?: boolean;
  /** English Wikipedia article title for the infobox-logo fallback (default: name). */
  wiki?: string;
  tags?: string[];
}

const B = (group: string, list: Array<string | Omit<Brand, 'group'>>): Brand[] =>
  list.map(b => (typeof b === 'string' ? { name: b, group } : { ...b, group }));

const BRANDS: Brand[] = [
  ...B('streaming', [
    { name: 'Netflix', file: 'Netflix 2015 logo.svg' },
    { name: 'Amazon Prime Video', q: 'Prime Video', match: ['prime', 'video'], tags: ['prime'] },
    { name: 'Disney+', q: 'Disney+', match: ['disney'], file: 'Disney+ logo.svg' },
    { name: 'JioHotstar', q: 'JioHotstar', match: ['hotstar'], app: 'JioHotstar', country: 'in', tags: ['hotstar', 'disney hotstar'], wiki: 'JioHotstar' },
    { name: 'Disney+ Hotstar', q: 'Disney+ Hotstar', match: ['hotstar'], app: 'Hotstar', country: 'in', tags: ['hotstar'] },
    { name: 'HBO Max', q: 'HBO Max', match: ['max'], tags: ['max', 'hbo'] },
    { name: 'Hulu', match: ['hulu'] },
    { name: 'Apple TV+', q: 'Apple TV Plus', match: ['apple', 'tv'], tags: ['apple tv'] },
    { name: 'Paramount+', q: 'Paramount+', match: ['paramount'] },
    { name: 'Peacock', q: 'Peacock TV', match: ['peacock'], app: 'Peacock TV', wiki: 'Peacock (streaming service)' },
    { name: 'Crunchyroll', match: ['crunchyroll'], tags: ['anime'] },
    { name: 'YouTube Premium', q: 'YouTube Premium', match: ['youtube', 'premium'] },
    { name: 'YouTube', q: 'YouTube', match: ['youtube'] },
    { name: 'ZEE5', match: ['zee5'], country: 'in' },
    { name: 'SonyLIV', q: 'Sony LIV', match: ['liv'], app: 'Sony LIV', country: 'in', file: 'SonyLIV 2020.png' },
    { name: 'MX Player', match: ['mx', 'player'], country: 'in' },
    { name: 'Tapmad', match: ['tapmad'], country: 'pk', wiki: 'Tapmad' },
    { name: 'Starzplay', q: 'Starzplay', match: ['starz'], app: 'STARZPLAY', country: 'ae' },
    { name: 'Shahid', match: ['shahid'], country: 'ae', file: 'Mbc Shahid logo.svg' },
    { name: 'OSN+', q: 'OSN', match: ['osn'], app: 'OSN+', country: 'ae' },
    { name: 'Discovery+', q: 'Discovery+', match: ['discovery'], wiki: 'Discovery+' },
    { name: 'MUBI', match: ['mubi'] },
    { name: 'Twitch', match: ['twitch'] },
    { name: 'Viu', q: 'Viu streaming', match: ['viu'] },
    { name: 'iQIYI', match: ['iqiyi'] },
    { name: 'Rakuten Viki', q: 'Viki', match: ['viki'] },
    { name: 'DAZN', match: ['dazn'], tags: ['sports'] },
    { name: 'ESPN+', q: 'ESPN+', match: ['espn'], tags: ['sports'], wiki: 'ESPN+' },
    { name: 'Tubi', match: ['tubi'] },
    { name: 'Plex', match: ['plex'] },
    { name: 'BritBox', match: ['britbox'] },
    { name: 'Starz', match: ['starz'], file: 'Starz 2022.svg' },
    { name: 'Aha', q: 'Aha OTT', match: ['aha'], app: 'aha', country: 'in' },
  ]),
  ...B('music', [
    { name: 'Spotify', match: ['spotify'], file: 'Spotify logo with text.svg' },
    { name: 'Apple Music', match: ['apple', 'music'] },
    { name: 'YouTube Music', match: ['youtube', 'music'] },
    { name: 'Amazon Music', match: ['amazon', 'music'] },
    { name: 'Deezer', match: ['deezer'] },
    { name: 'Tidal', q: 'Tidal music', match: ['tidal'] },
    { name: 'SoundCloud', match: ['soundcloud'] },
    { name: 'Audible', match: ['audible'], tags: ['audiobooks'] },
    { name: 'Anghami', match: ['anghami'], file: 'Anghami Icon.svg' },
    { name: 'JioSaavn', match: ['saavn'], country: 'in' },
    { name: 'Pandora', q: 'Pandora music', match: ['pandora'] },
  ]),
  ...B('ai', [
    { name: 'ChatGPT', match: ['chatgpt'], tags: ['openai', 'gpt'] },
    { name: 'OpenAI', match: ['openai'] },
    { name: 'Google Gemini', q: 'Google Gemini', match: ['gemini'], tags: ['gemini'] },
    { name: 'Claude', q: 'Claude AI', match: ['claude'], tags: ['anthropic'] },
    { name: 'Microsoft Copilot', q: 'Microsoft Copilot', match: ['copilot'], tags: ['copilot'] },
    { name: 'Perplexity', q: 'Perplexity AI', match: ['perplexity'] },
    { name: 'Midjourney', match: ['midjourney'] },
    { name: 'Grok', q: 'Grok xAI', match: ['grok'], tags: ['xai'] },
    { name: 'DeepSeek', match: ['deepseek'] },
    { name: 'GitHub Copilot', q: 'GitHub Copilot', match: ['github', 'copilot'] },
    { name: 'Cursor', q: 'Cursor AI editor', match: ['cursor'], app: 'Cursor', file: 'Cursor logo.svg' },
    { name: 'ElevenLabs', match: ['elevenlabs'] },
    { name: 'Runway', q: 'Runway ML', match: ['runway'], app: 'Runway Gen', file: 'Runway Logo.png' },
    { name: 'Character.AI', q: 'Character.ai', match: ['character'], app: 'Character AI' },
    { name: 'QuillBot', match: ['quillbot'], file: 'Quillbot.png' },
    { name: 'Suno', q: 'Suno AI', match: ['suno'], app: 'Suno', file: 'Suno AI icon.svg' },
  ]),
  ...B('vpn', [
    { name: 'NordVPN', match: ['nordvpn'] },
    { name: 'ExpressVPN', match: ['expressvpn'] },
    { name: 'Surfshark', match: ['surfshark'] },
    { name: 'Proton VPN', match: ['proton', 'vpn'] },
    { name: 'CyberGhost', match: ['cyberghost'], file: 'Cg-logo-yellow 256.png' },
    { name: 'Private Internet Access', match: ['private', 'internet', 'access'], tags: ['pia'] },
    { name: 'IPVanish', match: ['ipvanish'], file: 'Ipvanish-text-logo.png' },
    { name: 'Windscribe', match: ['windscribe'], file: 'Windscribe blue wordmark.svg' },
    { name: 'Hotspot Shield', match: ['hotspot', 'shield'], wiki: 'Hotspot Shield' },
    { name: 'TunnelBear', match: ['tunnelbear'] },
    { name: 'PureVPN', match: ['purevpn'] },
    { name: 'Mullvad VPN', q: 'Mullvad', match: ['mullvad'] },
  ]),
  ...B('security', [
    { name: 'Kaspersky', match: ['kaspersky'], tags: ['antivirus'] },
    { name: 'Norton', q: 'Norton antivirus', match: ['norton'], tags: ['antivirus'] },
    { name: 'McAfee', match: ['mcafee'], tags: ['antivirus'] },
    { name: 'Bitdefender', match: ['bitdefender'], tags: ['antivirus'] },
    { name: 'Avast', match: ['avast'], tags: ['antivirus'] },
    { name: 'AVG', q: 'AVG antivirus', match: ['avg'], app: 'AVG Mobile Security', tags: ['antivirus'], wiki: 'AVG AntiVirus' },
    { name: 'ESET', match: ['eset'], tags: ['antivirus'] },
    { name: 'Malwarebytes', match: ['malwarebytes'], tags: ['antivirus'] },
    { name: 'Avira', match: ['avira'], tags: ['antivirus'] },
    { name: 'Trend Micro', match: ['trend', 'micro'], tags: ['antivirus'] },
    { name: '1Password', match: ['1password'], tags: ['password manager'], file: '1Password icon.png' },
    { name: 'LastPass', match: ['lastpass'], tags: ['password manager'] },
    { name: 'Bitwarden', match: ['bitwarden'], tags: ['password manager'] },
    { name: 'Dashlane', match: ['dashlane'], tags: ['password manager'] },
    { name: 'NordPass', match: ['nordpass'], tags: ['password manager'], file: 'Nordpass.png' },
  ]),
  ...B('microsoft', [
    { name: 'Microsoft 365', match: ['microsoft', '365'], tags: ['office 365'] },
    { name: 'Windows 11', match: ['windows', '11'], tags: ['windows'] },
    { name: 'Microsoft Word', match: ['word'], tags: ['office'], file: 'Microsoft Office Word (2025–present).svg' },
    { name: 'Microsoft Excel', match: ['excel'], file: 'Microsoft Office Excel (2025–present).svg', tags: ['office'] },
    { name: 'Microsoft PowerPoint', match: ['powerpoint'], tags: ['office'] },
    { name: 'Microsoft Outlook', match: ['outlook'], tags: ['office'] },
    { name: 'Microsoft Teams', match: ['teams'], tags: ['office'] },
    { name: 'OneDrive', q: 'Microsoft OneDrive', match: ['onedrive'] },
    { name: 'Visual Studio', match: ['visual', 'studio'] },
    { name: 'Microsoft', q: 'Microsoft', match: ['microsoft'], file: 'Microsoft logo (2012).svg' },
  ]),
  ...B('adobe', [
    { name: 'Adobe Creative Cloud', match: ['creative', 'cloud'], tags: ['adobe'] },
    { name: 'Adobe Photoshop', match: ['photoshop'], file: 'Adobe Photoshop CC icon.svg', tags: ['adobe'] },
    { name: 'Adobe Illustrator', match: ['illustrator'], file: 'Adobe Illustrator CC icon.svg', tags: ['adobe'] },
    { name: 'Adobe Premiere Pro', match: ['premiere'], tags: ['adobe'] },
    { name: 'Adobe After Effects', match: ['after', 'effects'], tags: ['adobe'] },
    { name: 'Adobe Lightroom', match: ['lightroom'], tags: ['adobe'] },
    { name: 'Adobe Acrobat', match: ['acrobat'], tags: ['adobe', 'pdf'] },
    { name: 'Adobe InDesign', match: ['indesign'], tags: ['adobe'] },
    { name: 'Adobe Express', match: ['express'], app: 'Adobe Express', tags: ['adobe'] },
    { name: 'Adobe', q: 'Adobe Inc', match: ['adobe'], file: 'Adobe Corporate Logo.png' },
  ]),
  ...B('google', [
    { name: 'Google One', match: ['google', 'one'] },
    { name: 'Google Drive', match: ['drive'], file: 'Google Drive icon (2020).svg' },
    { name: 'Google Workspace', match: ['workspace'] },
    { name: 'Google Play', match: ['google', 'play'] },
    { name: 'Gmail', match: ['gmail'], file: 'Gmail icon (2020).svg' },
    { name: 'Google', q: 'Google 2015', match: ['google'], file: 'Google 2015 logo.svg' },
  ]),
  ...B('productivity', [
    { name: 'Canva', match: ['canva'], tags: ['design'] },
    { name: 'Figma', match: ['figma'], tags: ['design'] },
    { name: 'Notion', q: 'Notion app', match: ['notion'], file: 'Notion-logo.svg' },
    { name: 'Grammarly', match: ['grammarly'] },
    { name: 'Zoom', q: 'Zoom Video Communications', match: ['zoom'] },
    { name: 'Slack', q: 'Slack Technologies', match: ['slack'], file: 'Slack icon 2019.svg' },
    { name: 'Trello', match: ['trello'], file: 'Trello-logo-blue.svg' },
    { name: 'Dropbox', match: ['dropbox'] },
    { name: 'Evernote', match: ['evernote'], wiki: 'Evernote' },
    { name: 'CapCut', match: ['capcut'], tags: ['video editor'], file: 'Capcut-icon.svg' },
    { name: 'Wondershare Filmora', q: 'Filmora', match: ['filmora'], tags: ['video editor'] },
    { name: 'Envato', match: ['envato'], tags: ['design'], wiki: 'Envato' },
    { name: 'Freepik', match: ['freepik'], tags: ['design'] },
    { name: 'Shutterstock', match: ['shutterstock'], tags: ['stock images'] },
    { name: 'Miro', q: 'Miro whiteboard', match: ['miro'], wiki: 'Miro (collaboration platform)' },
    { name: 'Picsart', match: ['picsart'], tags: ['design'] },
    { name: 'AutoCAD', match: ['autocad'], tags: ['autodesk'] },
    { name: 'Autodesk', match: ['autodesk'] },
    { name: 'CorelDRAW', match: ['coreldraw'], tags: ['design'] },
    { name: 'Camtasia', match: ['camtasia'], tags: ['video editor'], wiki: 'Camtasia' },
    { name: 'Final Cut Pro', match: ['final', 'cut'], tags: ['video editor', 'apple'], wiki: 'Final Cut Pro' },
    { name: 'Todoist', match: ['todoist'], file: 'Todoist logo.png' },
        { name: 'iCloud', q: 'iCloud', match: ['icloud'], tags: ['apple'] },
    { name: 'MEGA', q: 'Mega cloud storage', match: ['mega'], tags: ['cloud storage'] },
  ]),
  ...B('education', [
    { name: 'Coursera', match: ['coursera'] },
    { name: 'Udemy', match: ['udemy'] },
    { name: 'Duolingo', match: ['duolingo'], tags: ['language'] },
    { name: 'LinkedIn Learning', match: ['linkedin', 'learning'], file: 'LinkedIn Learning logo.png' },
    { name: 'LinkedIn Premium', q: 'LinkedIn', match: ['linkedin'] },
    { name: 'Skillshare', match: ['skillshare'] },
    { name: 'edX', match: ['edx'] },
    { name: 'Khan Academy', match: ['khan', 'academy'] },
    { name: 'MasterClass', match: ['masterclass'] },
    { name: 'Chegg', match: ['chegg'] },
    { name: 'Quizlet', match: ['quizlet'] },
    { name: 'Scribd', match: ['scribd'] },
    { name: 'Codecademy', match: ['codecademy'] },
    { name: 'DataCamp', match: ['datacamp'], wiki: 'DataCamp' },
    { name: 'Babbel', match: ['babbel'], tags: ['language'] },
    { name: 'Brilliant', q: 'Brilliant.org', match: ['brilliant'] },
  ]),
  ...B('gaming', [
    { name: 'PlayStation Plus', match: ['playstation', 'plus'], tags: ['psn', 'playstation'], file: 'PlayStationPlus.svg' },
    { name: 'PlayStation', match: ['playstation'], file: 'PlayStation logo.svg', tags: ['psn'] },
    { name: 'Xbox Game Pass', match: ['game', 'pass'], tags: ['xbox'], file: 'Xbox Game Pass new logo - colored version.svg' },
    { name: 'Xbox', match: ['xbox'] },
    { name: 'Nintendo Switch Online', q: 'Nintendo Switch', match: ['nintendo', 'switch'], tags: ['nintendo'] },
    { name: 'Steam', q: 'Steam Valve', match: ['steam'], file: 'Steam icon logo.svg' },
    { name: 'Epic Games', match: ['epic', 'games'] },
    { name: 'EA Play', match: ['ea', 'play'], file: 'EA Play logo.svg', tags: ['electronic arts'] },
    { name: 'Ubisoft+', q: 'Ubisoft', match: ['ubisoft'], file: 'Ubisoft logo.svg' },
    { name: 'Roblox', match: ['roblox'], tags: ['robux'] },
    { name: 'PUBG Mobile', match: ['pubg'], tags: ['uc'], file: 'PUBG Mobile simple logo black.svg' },
    { name: 'Free Fire', q: 'Garena Free Fire', match: ['free', 'fire'], tags: ['diamonds'], wiki: 'Free Fire (video game)' },
    { name: 'Fortnite', match: ['fortnite'], tags: ['v-bucks'] },
    { name: 'Valorant', match: ['valorant'], file: 'Valorant logo - pink color version.svg', tags: ['riot'] },
    { name: 'Minecraft', match: ['minecraft'], file: 'Minecraft Logo-en.svg' },
    { name: 'Call of Duty', match: ['call', 'duty'] },
    { name: 'Battle.net', q: 'Battle.net', match: ['battle'], tags: ['blizzard'] },
    { name: 'Discord Nitro', q: 'Discord', match: ['discord'], tags: ['nitro'], wiki: 'Discord' },
    { name: 'Genshin Impact', match: ['genshin'] },
    { name: 'Mobile Legends', match: ['mobile', 'legends'], tags: ['diamonds'], wiki: 'Mobile Legends: Bang Bang' },
  ]),
  ...B('social', [
    { name: 'Telegram Premium', q: 'Telegram', match: ['telegram'] },
    { name: 'Snapchat+', q: 'Snapchat', match: ['snapchat'], wiki: 'Snapchat' },
    { name: 'X Premium', q: 'X (formerly Twitter)', match: ['x'], file: 'X logo 2023.svg', tags: ['twitter'] },
    { name: 'Tinder', match: ['tinder'] },
    { name: 'Bumble', match: ['bumble'] },
    { name: 'Amazon', q: 'Amazon', match: ['amazon'], file: 'Amazon logo.svg' },
    { name: 'Apple', q: 'Apple Inc', match: ['apple'] },
  ]),
];

/* ------------------------------------------------------------------ */
/* Category icons (Fluent Emoji 3D)                                    */
/* ------------------------------------------------------------------ */

interface Icon {
  slug: string;
  name: string;
  /** Folder name under fluentui-emoji/assets. */
  emoji: string;
  /** Words a category name/slug can contain to get this icon automatically. */
  keywords: string[];
}

const ICONS: Icon[] = [
  { slug: 'streaming', name: 'Streaming (TV)', emoji: 'Television', keywords: ['stream', 'ott', 'movie', 'tv', 'series', 'netflix'] },
  { slug: 'movies', name: 'Movies (clapper)', emoji: 'Clapper board', keywords: ['film', 'cinema'] },
  { slug: 'popcorn', name: 'Entertainment (popcorn)', emoji: 'Popcorn', keywords: ['entertainment'] },
  { slug: 'music', name: 'Music (headphones)', emoji: 'Headphone', keywords: ['music', 'audio', 'spotify', 'podcast'] },
  { slug: 'music-note', name: 'Music (note)', emoji: 'Musical notes', keywords: ['song'] },
  { slug: 'ai-tools', name: 'AI Tools (robot)', emoji: 'Robot', keywords: ['ai', 'gpt', 'chatgpt', 'artificial'] },
  { slug: 'vpn', name: 'VPN (lock)', emoji: 'Locked', keywords: ['vpn', 'privacy', 'proxy'] },
  { slug: 'security', name: 'Security (shield)', emoji: 'Shield', keywords: ['security', 'antivirus', 'protection', 'defender'] },
  { slug: 'software', name: 'Software (laptop)', emoji: 'Laptop', keywords: ['software', 'windows', 'office', 'productivity', 'licence', 'license'] },
  { slug: 'desktop', name: 'Desktop computer', emoji: 'Desktop computer', keywords: ['pc', 'computer'] },
  { slug: 'gaming', name: 'Gaming (gamepad)', emoji: 'Video game', keywords: ['game', 'gaming', 'console', 'playstation', 'xbox'] },
  { slug: 'joystick', name: 'Gaming (joystick)', emoji: 'Joystick', keywords: ['arcade'] },
  { slug: 'education', name: 'Education (books)', emoji: 'Books', keywords: ['education', 'learning', 'course', 'study'] },
  { slug: 'graduation', name: 'Education (graduation cap)', emoji: 'Graduation cap', keywords: ['university', 'exam'] },
  { slug: 'design', name: 'Design (palette)', emoji: 'Artist palette', keywords: ['design', 'creative', 'canva', 'adobe', 'art'] },
  { slug: 'video-editing', name: 'Video editing (camera)', emoji: 'Movie camera', keywords: ['video', 'editing', 'capcut'] },
  { slug: 'photo', name: 'Photo (camera)', emoji: 'Camera with flash', keywords: ['photo', 'stock'] },
  { slug: 'cloud', name: 'Cloud storage', emoji: 'Cloud', keywords: ['cloud', 'storage', 'drive', 'backup'] },
  { slug: 'mobile', name: 'Mobile apps (phone)', emoji: 'Mobile phone', keywords: ['mobile', 'app', 'phone', 'esim'] },
  { slug: 'social', name: 'Social media (speech bubble)', emoji: 'Speech balloon', keywords: ['social', 'chat', 'messaging', 'telegram', 'discord'] },
  { slug: 'gift-cards', name: 'Gift cards (gift)', emoji: 'Wrapped gift', keywords: ['gift', 'voucher', 'card', 'top-up', 'topup'] },
  { slug: 'keys', name: 'Licence keys (key)', emoji: 'Key', keywords: ['key', 'activation'] },
  { slug: 'premium', name: 'Premium (gem)', emoji: 'Gem stone', keywords: ['premium', 'deal', 'bundle'] },
  { slug: 'sparkles', name: 'Featured (sparkles)', emoji: 'Sparkles', keywords: ['featured', 'new', 'trending'] },
  { slug: 'rocket', name: 'Boost (rocket)', emoji: 'Rocket', keywords: ['boost', 'growth', 'marketing', 'seo'] },
  { slug: 'globe', name: 'Internet (globe)', emoji: 'Globe with meridians', keywords: ['internet', 'web', 'hosting', 'domain'] },
  { slug: 'shopping', name: 'Shopping (bags)', emoji: 'Shopping bags', keywords: ['shop', 'store', 'all'] },
  { slug: 'credit-card', name: 'Payments (card)', emoji: 'Credit card', keywords: ['payment', 'wallet'] },
  { slug: 'books-reading', name: 'Reading (open book)', emoji: 'Open book', keywords: ['ebook', 'reading', 'audiobook', 'kindle'] },
  { slug: 'sports', name: 'Sports (soccer ball)', emoji: 'Soccer ball', keywords: ['sport', 'football', 'cricket', 'live'] },
  { slug: 'tools', name: 'Utilities (toolbox)', emoji: 'Toolbox', keywords: ['tool', 'utility', 'utilities'] },
  { slug: 'brain', name: 'Smart tools (brain)', emoji: 'Brain', keywords: ['smart', 'intelligence'] },
];

/** Category id/slug to icon slug for the seeded categories. */
const CATEGORY_ICON: Record<string, string> = {
  cat_streaming: 'streaming',
  cat_music: 'music',
  cat_ai: 'ai-tools',
  cat_vpn: 'vpn',
  cat_antivirus: 'security',
  cat_productivity: 'design',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;

async function getJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (res.status === 429 || res.status >= 500) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`HTTP retry limit ${url}`);
}

async function download(url: string): Promise<{ buf: Buffer; mime: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429 || res.status >= 500) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const mime = (res.headers.get('content-type') || 'image/png').split(';')[0];
    if (!mime.startsWith('image/')) throw new Error(`not an image (${mime})`);
    return { buf: Buffer.from(await res.arrayBuffer()), mime };
  }
  throw new Error('download retry limit');
}

interface Source {
  url: string;
  from: 'wikimedia' | 'wikipedia' | 'appstore' | 'fluent';
  title: string;
  rounded?: boolean;
}

const BAD_WORDS = [
  'screenshot', 'headquarters', 'building', 'office building', 'store front', 'storefront', 'billboard', 'sign ', 'signage', 'booth', 'truck',
  'van ', 'car ', 'map', 'chart', 'graph', 'crowd', 'people', 'photo', 'stand ', 'event', 'conference', 'interface', 'ui ', 'example',
  'comparison', 'diagram', 'stamp', 'poster', 'banner', 'shirt', 'mug', 'sticker', 'packaging', 'box ', 'flag', 'coat of arms', 'route',
];

/** Commons results below this score fall back to the App Store icon. */
const MIN_SCORE = 4;

const NEUTRAL_WORDS = new Set(
  'logo logos logotype icon svg png wordmark symbol logomark emblem the of and with inc color colour colored coloured official new full cc app mark text horizontal vertical primary service company software website plus premium ai tv'.split(
    ' ',
  ),
);

function scoreTitle(title: string, match: string[], nameWords: string[]): number {
  const t = norm(title.replace(/^File:/, '').replace(/\.(svg|png|jpe?g|webp)$/i, ''));
  if (!match.every(w => t.includes(` ${w} `) || (w.length > 4 && t.includes(w)))) return -100;
  let s = 0;
  if (/ (logo|logotype|wordmark|emblem) /.test(t)) s += 5;
  // "ZEE5 2025.svg": just the brand name (plus a year) is usually the logo file.
  else if (t.trim().split(' ').every(w => match.includes(w) || nameWords.includes(w) || /^(19|20)\d\d$/.test(w))) s += 4;
  if (/ (icon|symbol|logomark) /.test(t)) s += 2;
  for (const bad of BAD_WORDS) if (t.includes(` ${bad.trim()} `)) s -= 6;
  if (/ (old|former|historic|historical|vintage|unofficial|fan|concept|pre) /.test(t)) s -= 4;
  const years = [...t.matchAll(/ (19|20)(\d\d) /g)].map(m => Number(m[1] + m[2]));
  if (years.length) {
    const y = Math.max(...years);
    s += y >= 2019 ? 2 : y >= 2014 ? 0 : -3;
  }
  // "2015 2020" style ranges mark a retired logo.
  if (/ (19|20)\d\d (19|20)\d\d /.test(t) && !/ (present|current) /.test(t)) s -= 4;
  // Words outside the brand name usually mean a sub-brand, event or other product ("Disney Store", "Spotify Wrapped").
  const known = new Set([...match, ...nameWords]);
  for (const w of t.trim().split(' ')) {
    if (!w || known.has(w) || NEUTRAL_WORDS.has(w) || [...known].some(k => k.length > 4 && w.includes(k) && w.length - k.length <= 3)) continue;
    if (/^(19|20)\d\d$/.test(w)) continue;
    s -= /^\d+$/.test(w) ? 1 : 5;
  }
  return s;
}

async function commonsByTitle(file: string): Promise<Source | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: `File:${file}`,
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1024',
  });
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const page = Object.values<any>(data?.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  return { url: info.thumburl || info.url, from: 'wikimedia', title: String(page.title) };
}

async function commonsSearch(b: Brand): Promise<Source | null> {
  const q = b.q || b.name;
  const match = (b.match || norm(q).trim().split(' ')).map(w => w.toLowerCase());
  const nameWords = [...norm(b.name).trim().split(' '), ...norm(q).trim().split(' '), ...(b.tags || []).flatMap(t => norm(t).trim().split(' '))];
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '25',
    gsrsearch: `${q} logo`,
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1024',
  });
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values<any>(data?.query?.pages || {});
  const ranked = pages
    .map(p => ({ p, info: p?.imageinfo?.[0] }))
    .filter(({ info }) => info && /image\/(png|svg\+xml)/.test(info.mime || ''))
    .filter(({ info }) => info.mime === 'image/svg+xml' || Math.max(info.width || 0, info.height || 0) >= 300)
    .map(({ p, info }) => ({
      p,
      info,
      score: scoreTitle(String(p.title), match, nameWords) + (info.mime === 'image/svg+xml' ? 2 : 0) - (p.index ?? 0) * 0.15,
    }))
    .filter(x => x.score > 0)
    .sort((a, b2) => b2.score - a.score);
  const best = ranked[0];
  if (!best || best.score < MIN_SCORE) return null;
  return { url: best.info.thumburl || best.info.url, from: 'wikimedia', title: String(best.p.title) };
}

// The iTunes Search API allows roughly 20 calls a minute, so calls are spaced out.
let itunesChain: Promise<unknown> = Promise.resolve();
let itunesBlocked = false;
function itunesSearch(params: URLSearchParams): Promise<any> {
  const run = itunesChain.then(async () => {
    if (itunesBlocked) return null;
    const data = await getJson(`https://itunes.apple.com/search?${params}`).catch((err: Error) => {
      // 403 = throttled for a while; stop using the App Store for this run.
      if (/HTTP 403/.test(err.message)) {
        itunesBlocked = true;
        console.warn('  (App Store search throttled; continuing without it)');
      }
      return null;
    });
    await new Promise(r => setTimeout(r, 3500));
    return data;
  });
  itunesChain = run.catch(() => null);
  return run;
}

async function appStore(b: Brand): Promise<Source | null> {
  const term = b.app || b.name;
  const first = (b.app ? norm(b.app).trim().split(' ')[0] : b.match?.[0]) || norm(term).trim().split(' ')[0];
  const has = (s: unknown) => {
    const t = norm(String(s || ''));
    return t.includes(` ${first} `) || (first.length > 4 && t.includes(first));
  };
  const countries = [b.country, 'us', 'in'].filter((c, i, a): c is string => Boolean(c) && a.indexOf(c) === i);
  for (const country of countries) {
    const params = new URLSearchParams({ term, entity: 'software', limit: '8', country });
    const data = await itunesSearch(params);
    const hit = (data?.results || []).find((r: any) => has(r.trackName));
    const art: string | undefined = hit?.artworkUrl512 || hit?.artworkUrl100;
    if (art) {
      return { url: art.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/512x512bb.png'), from: 'appstore', title: `${hit.trackName} (${country})`, rounded: true };
    }
  }
  return null;
}

/** The logo in the brand's English Wikipedia infobox (page image), when its file name looks like a logo. */
async function wikipediaLogo(b: Brand): Promise<Source | null> {
  const match = (b.match || norm(b.q || b.name).trim().split(' ')).map(w => w.toLowerCase());
  for (const title of [...new Set([b.wiki, b.name, b.q].filter((t): t is string => Boolean(t)))]) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'pageimages',
      piprop: 'original|thumbnail|name',
      pithumbsize: '1024',
      redirects: '1',
      titles: title,
    });
    const data = await getJson(`https://en.wikipedia.org/w/api.php?${params}`).catch(() => null);
    const page = Object.values<any>(data?.query?.pages || {})[0];
    const file = String(page?.pageimage || '');
    if (!file) continue;
    const t = norm(file);
    const looksLikeLogo = / (logo|logotype|wordmark|icon|emblem|symbol) /.test(t) || match.some(w => t.includes(` ${w} `) || (w.length > 4 && t.includes(w)));
    const unwanted = [...BAD_WORDS, 'client', 'login', 'window', 'menu'].some(bad => t.includes(` ${bad.trim()} `));
    if (!looksLikeLogo || unwanted || /\.(jpe?g|webp)$/i.test(file)) continue;
    if (!/\.svg$/i.test(file) && Math.max(page?.original?.width || 0, page?.original?.height || 0) < 200) continue;
    const url = /\.svg$/i.test(file) ? page?.thumbnail?.source : page?.original?.source || page?.thumbnail?.source;
    if (url) return { url, from: 'wikipedia', title: `File:${file.replace(/_/g, ' ')}` };
  }
  return null;
}

async function resolveBrand(b: Brand): Promise<Source | null> {
  if (b.preferApp) {
    const a = await appStore(b).catch(() => null);
    if (a) return a;
  }
  if (b.file) {
    const f = await commonsByTitle(b.file).catch(() => null);
    if (f) return f;
  }
  const c = await commonsSearch(b).catch(() => null);
  if (c) return c;
  const w = await wikipediaLogo(b).catch(() => null);
  if (w) return w;
  return b.preferApp ? null : appStore(b).catch(() => null);
}

/** App Store icons are full squares; round the corners like the app tile. */
async function roundCorners(buf: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    const size = 512;
    const r = Math.round(size * 0.2237);
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
    return await sharp(buf).resize(size, size).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  } catch {
    return buf;
  }
}

async function toDataUri(src: Source): Promise<string> {
  const { buf, mime } = await download(src.url);
  const out = src.rounded ? await roundCorners(buf) : buf;
  return `data:${src.rounded ? 'image/png' : mime};base64,${out.toString('base64')}`;
}

const pool = getPool();

async function hasTag(tag: string): Promise<{ url: string } | null> {
  const r = await pool.query<{ url: string }>(`SELECT url FROM media_library WHERE tags ? $1 LIMIT 1`, [tag]);
  return r.rows[0] ?? null;
}

async function runPool<T>(items: T[], workers: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await fn(item);
      }
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

interface Row {
  kind: 'logo' | 'icon';
  slug: string;
  name: string;
  status: 'uploaded' | 'exists' | 'resolved' | 'failed';
  from?: string;
  title?: string;
  url?: string;
  error?: string;
}

async function buildLibrary(rows: Row[]) {
  await runPool(BRANDS, 3, async b => {
    const slug = slugify(b.name);
    const tag = `lib:${slug}`;
    try {
      if (!FORCE && !DRY) {
        const existing = await hasTag(tag);
        if (existing) {
          rows.push({ kind: 'logo', slug, name: b.name, status: 'exists', url: existing.url });
          return;
        }
      }
      const src = await resolveBrand(b);
      if (!src) throw new Error('no usable source found');
      if (DRY) {
        rows.push({ kind: 'logo', slug, name: b.name, status: 'resolved', from: src.from, title: src.title, url: src.url });
        console.log(`~ ${b.name.padEnd(26)} ${src.from.padEnd(9)} ${src.title}`);
        return;
      }
      const tags = [...new Set([tag, slug, b.group, 'logo', ...norm(b.name).trim().split(' '), ...(b.tags || [])].map(t => t.toLowerCase()))];
      const img = await processCatalogueImage(await toDataUri(src), { kind: 'library', name: slug, tags: [slug, b.group, 'logo'] });
      await db.addMediaAsset({ publicId: img.publicId, url: img.url, name: b.name, tags, source: 'library', width: img.width, height: img.height, format: img.format });
      rows.push({ kind: 'logo', slug, name: b.name, status: 'uploaded', from: src.from, title: src.title, url: img.url });
      console.log(`+ ${b.name.padEnd(26)} ${src.from.padEnd(9)} ${img.width}x${img.height} ${img.url}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      rows.push({ kind: 'logo', slug, name: b.name, status: 'failed', error });
      console.warn(`! ${b.name.padEnd(26)} ${error}`);
    }
  });
}

async function buildIcons(rows: Row[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  await runPool(ICONS, 3, async icon => {
    const tag = `icon:${icon.slug}`;
    try {
      if (!FORCE && !DRY) {
        const existing = await hasTag(tag);
        if (existing) {
          urls.set(icon.slug, existing.url);
          rows.push({ kind: 'icon', slug: icon.slug, name: icon.name, status: 'exists', url: existing.url });
          return;
        }
      }
      const file = `${icon.emoji.toLowerCase().replace(/ /g, '_')}_3d.png`;
      const url = `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURIComponent(icon.emoji)}/3D/${file}`;
      if (DRY) {
        await download(url);
        rows.push({ kind: 'icon', slug: icon.slug, name: icon.name, status: 'resolved', from: 'fluent', url });
        console.log(`~ icon ${icon.slug.padEnd(16)} ${url}`);
        return;
      }
      const { buf } = await download(url);
      const img = await processCatalogueImage(`data:image/png;base64,${buf.toString('base64')}`, {
        kind: 'categories',
        name: `icon-${icon.slug}`,
        tags: ['category-icon', icon.slug],
      });
      const tags = [...new Set([tag, 'category-icon', 'icon', '3d', icon.slug, ...icon.keywords])];
      await db.addMediaAsset({ publicId: img.publicId, url: img.url, name: `Category icon: ${icon.name}`, tags, source: 'library', width: img.width, height: img.height, format: img.format });
      urls.set(icon.slug, img.url);
      rows.push({ kind: 'icon', slug: icon.slug, name: icon.name, status: 'uploaded', from: 'fluent', url: img.url });
      console.log(`+ icon ${icon.slug.padEnd(16)} ${img.width}x${img.height} ${img.url}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      rows.push({ kind: 'icon', slug: icon.slug, name: icon.name, status: 'failed', error });
      console.warn(`! icon ${icon.slug.padEnd(16)} ${error}`);
    }
  });
  return urls;
}

/** Picks the icon for a category: seeded mapping first, then keywords in its slug/name. */
function iconFor(c: { id: string; slug: string; name: string }): string | null {
  if (CATEGORY_ICON[c.id]) return CATEGORY_ICON[c.id];
  const text = norm(`${c.slug} ${c.name}`);
  for (const icon of ICONS) if (icon.keywords.some(k => text.includes(` ${k} `) || (k.length > 4 && text.includes(k)))) return icon.slug;
  return null;
}

/**
 * Sets each category's image to its 3D icon. A category keeps an image the
 * admin chose (anything outside the seeded local/brand-logo images) unless
 * --force-icons is passed.
 */
async function assignCategoryIcons(urls: Map<string, string>): Promise<number> {
  let n = 0;
  for (const c of await db.getCategories()) {
    const slug = iconFor(c);
    const url = slug ? urls.get(slug) : undefined;
    if (!url || c.image === url) continue;
    const img = c.image || '';
    const replaceable = !img || img.startsWith('/') || img.includes('/library/') || img.includes('/brands/');
    if (!replaceable && !FORCE_ICONS) continue;
    await db.updateCategory(c.id, { image: url });
    n++;
    console.log(`= category ${c.slug} -> ${slug}`);
  }
  return n;
}

async function main() {
  if (!DRY && !cloudinaryEnabled()) throw new Error('CLOUDINARY_URL is not set');
  const rows: Row[] = [];
  let assigned = 0;
  if (ONLY === 'all' || ONLY === 'icons') {
    const urls = await buildIcons(rows);
    if (!DRY) assigned = await assignCategoryIcons(urls);
  }
  if (ONLY === 'all' || ONLY === 'library') await buildLibrary(rows);

  const count = (kind: Row['kind'], status: Row['status']) => rows.filter(r => r.kind === kind && r.status === status).length;
  const summary = {
    logos: { total: rows.filter(r => r.kind === 'logo').length, uploaded: count('logo', 'uploaded'), exists: count('logo', 'exists'), resolved: count('logo', 'resolved'), failed: count('logo', 'failed') },
    icons: { total: rows.filter(r => r.kind === 'icon').length, uploaded: count('icon', 'uploaded'), exists: count('icon', 'exists'), resolved: count('icon', 'resolved'), failed: count('icon', 'failed') },
    categoriesAssigned: assigned,
    failures: rows.filter(r => r.status === 'failed').map(r => `${r.kind}:${r.name}: ${r.error}`),
  };
  const out = path.join(process.cwd(), '.agents', 'tasks', 'soft4u-phase2', `images-library${DRY ? '-dry' : ''}.json`);
  try {
    writeFileSync(out, JSON.stringify({ summary, rows: rows.sort((a, b) => a.slug.localeCompare(b.slug)) }, null, 2));
  } catch {
    // report folder is optional
  }
  console.log(JSON.stringify(summary, null, 2));
  await pool.end();
}

main().catch(async err => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  await pool.end().catch(() => {});
  process.exit(1);
});
