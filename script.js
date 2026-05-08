const seeds = {
  quarterfinals: [
    ['',''],    ['',''],    ['',''],    ['','']
  ],
  semifinals: [
    ['',''],    ['','']
  ],
  final: [['','']],
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
const ROUND_MATCH_LIMITS = {
  quarterfinals: { min: 1, max: 8, default: 4 },
  semifinals: { min: 1, max: 6, default: 2 },
  final: { min: 1, max: 4, default: 1 },
};
const ROUND_LABELS = {
  quarterfinals: 'Round 1',
  semifinals: 'Semifinals',
  final: 'Final',
};

function ensureMatchCount(round, requiredCount, defaultSlots = 2) {
  const base = Array.isArray(round) ? [...round] : [];
  while (base.length < requiredCount) {
    base.push(Array.from({ length: defaultSlots }, () => ''));
  }

  return base.slice(0, requiredCount).map((match) => {
    const list = Array.isArray(match) ? [...match] : [''];
    return list.length ? list : [''];
  });
}

function normalizeRoundSizes(nextState) {
  return {
    ...nextState,
    quarterfinals: ensureMatchCount(nextState.quarterfinals, Math.max(ROUND_MATCH_LIMITS.quarterfinals.min, Math.min(ROUND_MATCH_LIMITS.quarterfinals.max, nextState.quarterfinals?.length || ROUND_MATCH_LIMITS.quarterfinals.default))),
    semifinals: ensureMatchCount(nextState.semifinals, Math.max(ROUND_MATCH_LIMITS.semifinals.min, Math.min(ROUND_MATCH_LIMITS.semifinals.max, nextState.semifinals?.length || ROUND_MATCH_LIMITS.semifinals.default))),
    final: ensureMatchCount(nextState.final, Math.max(ROUND_MATCH_LIMITS.final.min, Math.min(ROUND_MATCH_LIMITS.final.max, nextState.final?.length || ROUND_MATCH_LIMITS.final.default))),
  };
}

function createTeamNode(name = '') {
  const el = document.createElement('div');
  el.className = 'team';
  el.textContent = name || '—';
  return el;
}

function createMatchNode(roundName, matchIndex) {
  const matchEl = document.createElement('div');
  matchEl.className = 'match';
  matchEl.dataset.match = String(matchIndex);

  if (roundName === 'quarterfinals') {
    const right = document.createElement('div');
    right.className = 'connector connector--right';
    matchEl.appendChild(right);
  } else if (roundName === 'semifinals') {
    const left = document.createElement('div');
    left.className = 'connector connector--left';
    const right = document.createElement('div');
    right.className = 'connector connector--right';
    matchEl.appendChild(left);
    matchEl.appendChild(right);
  } else if (roundName === 'final') {
    const left = document.createElement('div');
    left.className = 'connector connector--left';
    matchEl.appendChild(left);
  }

  const teams = document.createElement('div');
  teams.className = 'teams';
  matchEl.appendChild(teams);
  return matchEl;
}

function paintMatches(roundName, names) {
  const roundEl = qs(`.round[data-round="${roundName}"]`);
  if (!roundEl) return;
  const heading = qs('h3', roundEl);
  if (heading) {
    const groupCount = Array.isArray(names) && names.length ? names.length : 1;
    heading.textContent = `${ROUND_LABELS[roundName] || roundName} · ${groupCount} ${groupCount === 1 ? 'group' : 'groups'}`;
  }
  const matchesWrap = qs('.matches', roundEl);
  if (!matchesWrap) return;

  const requiredCount = Array.isArray(names) && names.length ? names.length : 1;
  const currentCount = qsa('.match', matchesWrap).length;
  if (currentCount !== requiredCount) {
    matchesWrap.innerHTML = '';
    for (let i = 0; i < requiredCount; i += 1) {
      matchesWrap.appendChild(createMatchNode(roundName, i));
    }
  }

  const matchEls = qsa('.match', matchesWrap);
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
  state = normalizeRoundSizes(deepCopy(seeds));
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

  state = normalizeRoundSizes({
    quarterfinals: buildRandomRound(state.quarterfinals || seeds.quarterfinals, 4),
    semifinals: buildRandomRound(state.semifinals || seeds.semifinals, 2),
    final: buildRandomRound(state.final || seeds.final, 1),
    champion: 'Your pick', // stays editable separately
  });

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

  state = normalizeRoundSizes({
    quarterfinals: blankRound(state.quarterfinals || seeds.quarterfinals, 4),
    semifinals: blankRound(state.semifinals || seeds.semifinals, 2),
    final: blankRound(state.final || seeds.final, 1),
    champion: '',
  });

  paintMatches('quarterfinals', state.quarterfinals);
  paintMatches('semifinals', state.semifinals);
  paintMatches('final', state.final);
  paintChampion(state.champion);
  applyPalette();
}

function renderEditorSection(title, roundKey, data) {
  const section = document.createElement('div');
  section.className = 'edit-section';
  section.dataset.roundSection = roundKey;

  const headingRow = document.createElement('div');
  headingRow.className = 'section-head';

  const heading = document.createElement('h4');
  heading.textContent = title;

  const controls = document.createElement('div');
  controls.className = 'chips';

  const removeGroupBtn = document.createElement('button');
  removeGroupBtn.type = 'button';
  removeGroupBtn.className = 'chip';
  removeGroupBtn.dataset.action = 'remove-group';
  removeGroupBtn.dataset.round = roundKey;
  removeGroupBtn.textContent = '− Group';

  const addGroupBtn = document.createElement('button');
  addGroupBtn.type = 'button';
  addGroupBtn.className = 'chip';
  addGroupBtn.dataset.action = 'add-group';
  addGroupBtn.dataset.round = roundKey;
  addGroupBtn.textContent = '+ Group';

  controls.appendChild(removeGroupBtn);
  controls.appendChild(addGroupBtn);
  headingRow.appendChild(heading);
  headingRow.appendChild(controls);
  section.appendChild(headingRow);

  const grid = document.createElement('div');
  grid.className = 'inputs-grid';
  grid.dataset.roundGrid = roundKey;

  data.forEach((list, matchIndex) => {
    grid.appendChild(createMatchBlock(roundKey, matchIndex, list));
  });

  section.appendChild(grid);
  reindexMatchBlocks(grid, roundKey);
  return section;
}

function createMatchBlock(roundKey, matchIndex, list) {
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
  return matchBlock;
}

function createPersonRow(round, match, index, value) {
  const row = document.createElement('div');
  row.className = 'input-row';

  const label = document.createElement('label');
  label.textContent = `Person ${index + 1}`;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.placeholder = `Person ${index + 1}`;
  input.setAttribute('aria-label', `${round} group ${Number(match) + 1} person ${index + 1}`);
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
      input.placeholder = `Person ${idx + 1}`;
      input.setAttribute('aria-label', `${round} group ${Number(match) + 1} person ${idx + 1}`);
    }
  });

  const matchBlock = personsEl.closest('.match-block');
  const removeBtn = matchBlock ? qs('[data-action="remove"]', matchBlock) : null;
  if (removeBtn) {
    removeBtn.disabled = personsEl.children.length <= 1;
  }
}

function reindexMatchBlocks(gridEl, round) {
  const blocks = qsa('.match-block', gridEl);
  blocks.forEach((block, idx) => {
    block.dataset.match = String(idx);
    const title = qs('.title', block);
    if (title) title.textContent = `Group ${idx + 1}`;

    qsa('[data-action="add"], [data-action="remove"]', block).forEach((btn) => {
      btn.dataset.round = round;
      btn.dataset.match = String(idx);
    });

    const persons = qs('.persons', block);
    if (persons) reindexPersons(persons, round, String(idx));
  });

  const limits = ROUND_MATCH_LIMITS[round];
  const section = gridEl.closest('.edit-section');
  const addGroupBtn = section ? qs('[data-action="add-group"]', section) : null;
  const removeGroupBtn = section ? qs('[data-action="remove-group"]', section) : null;

  if (addGroupBtn && limits) addGroupBtn.disabled = blocks.length >= limits.max;
  if (removeGroupBtn && limits) removeGroupBtn.disabled = blocks.length <= limits.min;
}

function handleEditorClick(evt) {
  const button = evt.target.closest('[data-action]');
  if (!button) return;
  const { action, round, match } = button.dataset;
  const limits = ROUND_MATCH_LIMITS[round];

  if (action === 'add-group' || action === 'remove-group') {
    const section = button.closest('.edit-section');
    const grid = section ? qs(`[data-round-grid="${round}"]`, section) : null;
    if (!grid || !limits) return;

    const blocks = qsa('.match-block', grid);
    if (action === 'add-group' && blocks.length < limits.max) {
      grid.appendChild(createMatchBlock(round, blocks.length, ['']));
    }
    if (action === 'remove-group' && blocks.length > limits.min) {
      grid.removeChild(blocks[blocks.length - 1]);
    }
    reindexMatchBlocks(grid, round);
    return;
  }

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

  const helper = document.createElement('p');
  helper.className = 'editor-helper';
  helper.textContent = 'Edit groups and people directly. Use + Group / - Group to change how many groups each round has.';
  container.appendChild(helper);

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
    quarterfinals: [],
    semifinals: [],
    final: [],
    champion: state.champion,
  };

  ['quarterfinals', 'semifinals', 'final'].forEach((round) => {
    const blocks = qsa(`.match-block[data-round="${round}"]`, form);
    next[round] = blocks.map(() => []);
  });

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

  state = normalizeRoundSizes(next);
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
  const editorOverlay = qs('#editor');

  shuffleBtn?.addEventListener('click', shuffleNames);
  clearBtn?.addEventListener('click', clearNames);
  resetBtn?.addEventListener('click', resetBracket);
  editBtn?.addEventListener('click', openEditor);
  editorClose?.addEventListener('click', closeEditor);
  editorCancel?.addEventListener('click', closeEditor);
  editorForm?.addEventListener('submit', handleSave);
  editorForm?.addEventListener('click', handleEditorClick);
  editorOverlay?.addEventListener('click', (evt) => {
    if (evt.target === editorOverlay) closeEditor();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') closeEditor();
  });
}

resetBracket();
wireControls();
