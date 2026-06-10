// 1. Inject the Supabase CDN Client Library Layer Module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/*
// 2. Import your credentials relative to the data/ folder
import { SUPABASE_CONFIG } from '../../config.js';

// 3. Initialize Supabase Engine Engine
const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
*/

// Decode Obfuscated Credentials at Runtime (Keeps repository free of direct text keys)
const _u = atob('aHR0cHM6Ly91cXpjb29ub2FkYnJ0d3d3enFyeS5zdXBhYmFzZS5jbw==');
const _k = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5WeGVtTnZiMjV2WVdSaWNuUjNkM2Q2Y1hKNUlpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFd05EYzROVGdzSW1WNGNDSTZNakE1TmpZeU16ZzFPSDAuTUI2dWZoQVRteEQxMjBSUWhxTXVra3pLTm4yMERXRE5HcG5Mb3JQZExQRQ==');

const supabase = createClient(_u, _k);

function getResultMessage(score) {
  if (score >= 2000) return 'You know Sam suspiciously well 😳';
  if (score >= 1500) return 'Impressive. You definitely pay attention 👏';
  if (score >= 1000) return 'Not bad at all 🙂';
  return 'Samuel is disappointed 😂';
}

async function init() {
  const params = new URLSearchParams(location.search);
  const resultId = params.get('result');

  // 1. Fetch full leaderboard
  const { data, error } = await supabase
    .from('quiz_leaderboard')
    .select('*')
    .order('score', { ascending: false });

  if (error) {
    console.error('Failed to load leaderboard:', error);
    return;
  }

  const records = data || [];

  // 2. If a result ID is in the URL, show the result card
  if (resultId) {
    const entry = records.find(r => String(r.id) === String(resultId));
    if (entry) {
      const rank = records.indexOf(entry) + 1;
      document.querySelector('.js-result-card').style.display = 'block';
      document.querySelector('.js-rc-score').textContent = entry.score;
      document.querySelector('.js-rc-feedback').textContent = getResultMessage(entry.score);
      document.querySelector('.js-rc-time').textContent = `${Number(entry.total_duration_seconds).toFixed(2)}s`;
      document.querySelector('.js-rc-rank').textContent = `#${rank}`;
      document.querySelector('.js-rc-total').textContent = `/${records.length}`;
    }
  }

  // 3. Render leaderboard list, highlighting the linked entry
  const list = document.querySelector('.js-leaderboard-list');
  if (records.length === 0) {
    list.innerHTML = '<li class="quiz__leaderboard-item"><p style="padding:1rem;opacity:0.5">No scores yet.</p></li>';
    return;
  }

  const medalAssets = [
    `<img src="../01_quiz-game/assets/images/1st-place-medal-svgrepo-com 1.png" alt="Gold Medal" class="quiz__medal">`,
    `<img src="../01_quiz-game/assets/images/2nd-place-medal-svgrepo-com 1.png" alt="Silver Medal" class="quiz__medal">`,
    `<img src="../01_quiz-game/assets/images/3rd-place-medal-svgrepo-com 1.png" alt="Bronze Medal" class="quiz__medal">`,
  ];
  const medalClasses = ['quiz__leaderboard-pos-first', 'quiz__leaderboard-pos-second', 'quiz__leaderboard-pos-third'];

  list.innerHTML = records.slice(0, 10).map((player, i) => {
    const pos = i + 1;
    const isHighlighted = resultId && String(player.id) === String(resultId);
    const rowClass = isHighlighted ? 'quiz__leaderboard-item quiz__leaderboard-item--current-user' : 'quiz__leaderboard-item';
    const duration = player.total_duration_seconds ? `${Number(player.total_duration_seconds).toFixed(1)}s` : '--';

    return `
      <li class="${rowClass}">
        <div class="quiz__leaderboard-pos ${medalClasses[i] || ''}">${pos}</div>
        <div class="quiz__leaderboard-details">
          <p class="quiz__leaderboard-name">${player.display_name || 'Anon'}</p>
          <span class="quiz__leaderboard-time">Duration: <strong>${duration}</strong></span>
        </div>
        <div class="quiz__leaderboard-score">
          ${medalAssets[i] || ''}
          <span class="quiz__score-digits">${player.score}</span>
        </div>
      </li>`;
  }).join('');
}

init();