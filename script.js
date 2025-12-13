const seeds = {
  quarterfinals: [
    ['',''],    ['',''],    ['',''],    ['','']
  ],
  semifinals: [
    ['',''],    ['',''],    ['',''],    ['','']
  ],
  final: [['',''],    ['','']],
  champion: '',
};

const palettes = [
  ['#fbe2eb', '#d3edd2'],
  ['#ffd9c5', '#e7d8ff'],
  ['#f6c2d4', '#d3edd2'],
  ['#d3edd2', '#fbe2eb'],
];

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

let state = deepCopy(seeds);

function createTeamNode(name = '') {
  const el = document.createElement('div');
  el.className = 'team';
  el.textContent = name || '—';
  return el;
}

function paintMatches(roundName, names) {
  const roundEl = qs(`.round[data-round="${roundName}"]`);
  if (!roundEl) return;

  const matchEls = qsa('.match', roundEl);
  matchEls.forEach((matchEl, i) => {
    const teamsWrap = qs('.teams', matchEl);
    if (!teamsWrap) return;
    teamsWrap.innerHTML = '';
    const people = names[i] && names[i].length ? names[i] : [''];
    people.forEach((name) => {
      teamsWrap.appendChild(createTeamNode(name));
    });
  });
}

function paintChampion(name) {
  const target = qs('#champion-name');
  if (target) target.textContent = name;
}

function applyPalette() {
  qsa('.match').forEach((matchEl, i) => {
    const palette = palettes[i % palettes.length];
    matchEl.style.background = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  });
}

function resetBracket() {
  state = deepCopy(seeds);
  paintMatches('quarterfinals', state.quarterfinals);
  paintMatches('semifinals', state.semifinals);
  paintMatches('final', state.final);
  paintChampion(state.champion);
  applyPalette();
  closeEditor();
}

function shuffleNames() {
  // Light randomizer to keep things playful.
  const pool = [
    'Jade Foam',
    'Rose Velvet',
    'Strawberry Cream',
    'Matcha Mellow',
    'Blush Bloom',
    'Mint Silk',
    'Lychee Latte',
    'Pistachio Drift',
  ];

  const draw = () => pool[Math.floor(Math.random() * pool.length)];

  const buildRandomRound = (round, fallbackMatches = 0) => {
    const base = round && round.length ? round : Array.from({ length: fallbackMatches }, () => []);
    return base.map((match) => {
      const slots = match && match.length ? match.length : 2;
      return Array.from({ length: slots }, () => draw());
    });
  };

  state = {
    quarterfinals: buildRandomRound(state.quarterfinals || seeds.quarterfinals, 4),
    semifinals: buildRandomRound(state.semifinals || seeds.semifinals, 2),
    final: buildRandomRound(state.final || seeds.final, 1),
    champion: 'Your pick', // stays editable separately
  };

  paintMatches('quarterfinals', state.quarterfinals);
  paintMatches('semifinals', state.semifinals);
  paintMatches('final', state.final);
  paintChampion(state.champion);
  applyPalette();
}

function clearNames() {
  const blankRound = (round, fallbackMatches) => {
    const base = round && round.length ? round : Array.from({ length: fallbackMatches }, () => []);
    return base.map((match) => {
      const slots = match && match.length ? match.length : 1;
      return Array.from({ length: slots }, () => '');
    });
  };

  state = {
    quarterfinals: blankRound(state.quarterfinals || seeds.quarterfinals, 4),
    semifinals: blankRound(state.semifinals || seeds.semifinals, 2),
    final: blankRound(state.final || seeds.final, 1),
    champion: '',
  };

  paintMatches('quarterfinals', state.quarterfinals);
  paintMatches('semifinals', state.semifinals);
  paintMatches('final', state.final);
  paintChampion(state.champion);
  applyPalette();
}

function renderEditorSection(title, roundKey, data) {
  const section = document.createElement('div');
  section.className = 'edit-section';

  const heading = document.createElement('h4');
  heading.textContent = title;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'inputs-grid';

  data.forEach((list, matchIndex) => {
    const matchBlock = document.createElement('div');
    matchBlock.className = 'match-block';
    matchBlock.dataset.round = roundKey;
    matchBlock.dataset.match = matchIndex;

    const head = document.createElement('div');
    head.className = 'match-head';
    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = `Group ${matchIndex + 1}`;

    const chips = document.createElement('div');
    chips.className = 'chips';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'chip';
    addBtn.dataset.action = 'add';
    addBtn.dataset.round = roundKey;
    addBtn.dataset.match = matchIndex;
    addBtn.textContent = '+ Add person';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'chip';
    removeBtn.dataset.action = 'remove';
    removeBtn.dataset.round = roundKey;
    removeBtn.dataset.match = matchIndex;
    removeBtn.textContent = '− Remove last';

    chips.appendChild(addBtn);
    chips.appendChild(removeBtn);
    head.appendChild(titleEl);
    head.appendChild(chips);

    matchBlock.appendChild(head);

    const persons = document.createElement('div');
    persons.className = 'inputs-grid persons';

    const people = list && list.length ? list : [''];
    people.forEach((personName, personIndex) => {
      persons.appendChild(createPersonRow(roundKey, matchIndex, personIndex, personName));
    });

    matchBlock.appendChild(persons);
    grid.appendChild(matchBlock);
  });

  section.appendChild(grid);
  return section;
}

function createPersonRow(round, match, index, value) {
  const row = document.createElement('div');
  row.className = 'input-row';

  const label = document.createElement('label');
  label.textContent = `Person ${index + 1}`;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.dataset.round = round;
  input.dataset.match = match;
  input.dataset.pos = index;

  label.appendChild(input);
  row.appendChild(label);
  return row;
}

function reindexPersons(personsEl, round, match) {
  qsa('.input-row', personsEl).forEach((row, idx) => {
    const label = qs('label', row);
    if (label && label.firstChild) label.firstChild.textContent = `Person ${idx + 1}`;
    const input = qs('input', row);
    if (input) {
      input.dataset.round = round;
      input.dataset.match = match;
      input.dataset.pos = idx;
    }
  });
}

function handleEditorClick(evt) {
  const button = evt.target.closest('[data-action]');
  if (!button) return;
  const { action, round, match } = button.dataset;
  const matchBlock = button.closest('.match-block');
  const persons = matchBlock?.querySelector('.persons');
  if (!persons) return;

  if (action === 'add') {
    const nextIndex = persons.children.length;
    persons.appendChild(createPersonRow(round, match, nextIndex, ''));
  } else if (action === 'remove') {
    if (persons.children.length > 1) {
      persons.removeChild(persons.lastElementChild);
    } else {
      // leave one input so a group can't disappear entirely
      const input = persons.querySelector('input');
      if (input) input.value = '';
    }
  }

  reindexPersons(persons, round, match);
}

function renderEditor() {
  const container = qs('#editor-content');
  if (!container) return;
  container.innerHTML = '';

  const qf = renderEditorSection('Round 1 · 4 groups', 'quarterfinals', state.quarterfinals);
  const sf = renderEditorSection('Semifinals · 2', 'semifinals', state.semifinals);
  const fi = renderEditorSection('Final · 1', 'final', state.final);

  container.appendChild(qf);
  container.appendChild(sf);
  container.appendChild(fi);

  const champ = document.createElement('div');
  champ.className = 'edit-section champion-input';
  const label = document.createElement('label');
  label.textContent = 'Champion';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'champion-input';
  input.value = state.champion || '';
  champ.appendChild(label);
  champ.appendChild(input);
  container.appendChild(champ);
}

function openEditor() {
  renderEditor();
  qs('#editor')?.classList.remove('hidden');
}

function closeEditor() {
  qs('#editor')?.classList.add('hidden');
}

function handleSave(e) {
  e.preventDefault();
  const form = e.target;
  const inputs = qsa('input[data-round]', form);

  const next = {
    quarterfinals: state.quarterfinals.map(() => []),
    semifinals: state.semifinals.map(() => []),
    final: state.final.map(() => []),
    champion: state.champion,
  };

  inputs.forEach((input) => {
    const round = input.dataset.round;
    const match = Number(input.dataset.match);
    const pos = Number(input.dataset.pos);
    if (!next[round]) return;
    if (!next[round][match]) next[round][match] = [];
    next[round][match][pos] = input.value.trim();
  });

  ['quarterfinals', 'semifinals', 'final'].forEach((round) => {
    next[round] = next[round].map((list) => {
      const cleaned = (list || []).filter((name) => name && name.trim().length > 0);
      return cleaned.length ? cleaned : [''];
    });
  });

  const championInput = qs('#champion-input', form);
  if (championInput) {
    next.champion = championInput.value.trim() || 'Champion';
  }

  state = next;
  paintMatches('quarterfinals', state.quarterfinals);
  paintMatches('semifinals', state.semifinals);
  paintMatches('final', state.final);
  paintChampion(state.champion);
  applyPalette();
  closeEditor();
}

function wireControls() {
  const shuffleBtn = qs('#shuffle');
  const resetBtn = qs('#reset');
  const editBtn = qs('#edit');
  const clearBtn = qs('#clear');
  const editorClose = qs('#editor-close');
  const editorCancel = qs('#editor-cancel');
  const editorForm = qs('#editor-form');

  shuffleBtn?.addEventListener('click', shuffleNames);
  clearBtn?.addEventListener('click', clearNames);
  resetBtn?.addEventListener('click', resetBracket);
  editBtn?.addEventListener('click', openEditor);
  editorClose?.addEventListener('click', closeEditor);
  editorCancel?.addEventListener('click', closeEditor);
  editorForm?.addEventListener('submit', handleSave);
  editorForm?.addEventListener('click', handleEditorClick);

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') closeEditor();
  });
}

resetBracket();
wireControls();
