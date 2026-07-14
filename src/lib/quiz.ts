// The final CPD assessment. Server-side source of truth for questions,
// answers and the pass mark — /api/complete-quiz scores submissions against
// this, so a forged client can't self-certify a pass.

export interface QuizQuestion {
  m: string // module tag
  q: string // question
  opts: string[]
  a: number // index of correct option
  e: string // explanation
}

export const PASS_PERCENT = 80

export const QUESTIONS: QuizQuestion[] = [
  // ---- Module 1: Fundamentals ----
  {
    m: 'Module 1 · Fundamentals',
    q: 'Which is the most common type of skin cancer, accounting for around 75% of cases?',
    opts: ['Melanoma', 'Squamous cell carcinoma (SCC)', 'Basal cell carcinoma (BCC)', 'Merkel cell carcinoma'],
    a: 2,
    e: "BCC is the most common (~75%). It's slow-growing and rarely spreads, but can cause local tissue damage if left untreated.",
  },
  {
    m: 'Module 1 · Fundamentals',
    q: 'Although melanoma accounts for only about 5% of skin cancers, why does it receive so much attention?',
    opts: ['It is the easiest type to spot', 'It is responsible for the majority of skin cancer deaths', 'It only affects fair-skinned people', 'It never spreads beyond the skin'],
    a: 1,
    e: 'Melanoma is responsible for the majority of skin cancer deaths, which is why early detection matters so much.',
  },
  {
    m: 'Module 1 · Fundamentals',
    q: 'For stage one melanoma, roughly what is the five-year survival rate?',
    opts: ['Around 50%', 'Around 75%', 'Over 95%', 'Under 40%'],
    a: 2,
    e: 'Over 95% at stage one — dropping dramatically at stage four. Early detection genuinely saves lives.',
  },
  {
    m: 'Module 1 · Fundamentals',
    q: 'As a physiotherapist, what is your role in skin cancer awareness?',
    opts: ['To diagnose suspicious lesions', 'To biopsy anything unusual', 'To notice something unusual and encourage the patient to get it checked', 'To prescribe treatment for skin cancer'],
    a: 2,
    e: 'You are not being asked to diagnose. The role is simply to notice and mention it, encouraging the patient to seek a check.',
  },
  // ---- Module 2: Sport-specific ----
  {
    m: 'Module 2 · Sport-Specific Risk',
    q: 'For a right-handed golfer, which side of the face tends to receive more sun exposure?',
    opts: ['The right side', 'The left side', 'Both sides equally', 'Neither — the face is usually shaded'],
    a: 1,
    e: 'Right-handed players spend hours looking down the fairway, exposing the left side of the face more.',
  },
  {
    m: 'Module 2 · Sport-Specific Risk',
    q: 'Which frequently-missed area is a specific risk zone for golfers?',
    opts: ['The soles of the feet', 'The backs of the hands', 'The lower back', 'The inner thighs'],
    a: 1,
    e: 'Golfers grip a club for hours in direct sun, and the dorsal (back) hand surface is rarely sunscreened.',
  },
  {
    m: 'Module 2 · Sport-Specific Risk',
    q: "A commonly missed high-exposure area for tennis players who don't wear a cap is:",
    opts: ['The scalp along the part line', 'The palms', 'The ankles', 'The abdomen'],
    a: 0,
    e: "The scalp along the part line is easily overlooked, particularly for players who don't wear a cap.",
  },
  {
    m: 'Module 2 · Sport-Specific Risk',
    q: 'In racquet sports, you may notice more sun damage on one arm than the other. Why?',
    opts: ['The non-dominant arm is held higher', 'The dominant (playing) forearm and hand are more exposed', 'Sunscreen only reaches one side', 'Both arms are affected equally'],
    a: 1,
    e: 'The dominant playing arm is often more exposed than the non-dominant side, producing asymmetric sun damage.',
  },
  {
    m: 'Module 2 · Sport-Specific Risk',
    q: 'What is the key practical message about UV exposure and sport?',
    opts: ['Only summer training carries risk', 'A full skin check is required for every athlete', 'Cumulative UV exposure during outdoor training increases skin cancer risk', 'Indoor athletes are at equal risk'],
    a: 2,
    e: 'Cumulative UV exposure builds over repeated sessions. Knowing the sport tells you which zones are most at risk — no full skin check needed.',
  },
  // ---- Module 3: Skin types & risk ----
  {
    m: 'Module 3 · Skin Types & Risk',
    q: 'Which scale is used to classify skin based on its response to UV radiation?',
    opts: ['The Glasgow scale', 'The Fitzpatrick scale', 'The Breslow scale', 'The Clark scale'],
    a: 1,
    e: 'The Fitzpatrick scale runs from Type 1 to Type 6, classifying skin by its response to UV.',
  },
  {
    m: 'Module 3 · Skin Types & Risk',
    q: 'Which Fitzpatrick skin types carry the highest risk of UV-related skin cancers?',
    opts: ['Types 1 and 2', 'Types 3 and 4', 'Types 5 and 6', 'All types equally'],
    a: 0,
    e: 'Types 1 and 2 (fair skin that burns easily) carry the highest risk — but skin cancer can occur in ANY skin type.',
  },
  {
    m: 'Module 3 · Skin Types & Risk',
    q: 'In patients with darker skin (Types 5 and 6), where does melanoma more commonly occur?',
    opts: ['Only on the face', 'On the palms, soles of the feet, and nail beds', 'Only on sun-exposed areas', 'It cannot occur in these skin types'],
    a: 1,
    e: 'Acral melanoma appears in non-sun-exposed sites like palms, soles and nail beds — and is often diagnosed late because nobody was looking.',
  },
  {
    m: 'Module 3 · Skin Types & Risk',
    q: "Roughly how many moles constitutes a 'high mole count' that increases melanoma risk?",
    opts: ['10 or more', '25 or more', '50 or more', '100 or more'],
    a: 2,
    e: 'A high mole count is roughly 50 or more, which is an established risk factor for melanoma.',
  },
  {
    m: 'Module 3 · Skin Types & Risk',
    q: 'Which of the following is a recognised skin cancer risk factor?',
    opts: ['Regular exercise', 'A history of severe sunburn, especially in childhood', 'Drinking plenty of water', 'Having a low mole count'],
    a: 1,
    e: 'Severe sunburn (particularly in childhood/adolescence), family history, immunosuppression and high mole count all raise risk.',
  },
  // ---- Module 4: Red flags / ABCDE ----
  {
    m: 'Module 4 · Clinical Red Flags',
    q: "In the ABCDE framework, what does 'A' stand for?",
    opts: ['Ageing', 'Asymmetry', 'Appearance', 'Area'],
    a: 1,
    e: 'A is for Asymmetry — in a suspicious lesion, one half may look noticeably different from the other.',
  },
  {
    m: 'Module 4 · Clinical Red Flags',
    q: "'E' in the ABCDE checklist — described as arguably the most important — stands for:",
    opts: ['Elevation only', 'Evolution (change over time)', 'Edges', 'Erythema'],
    a: 1,
    e: 'E is for Evolution: any lesion changing in size, shape, colour or elevation — or that itches, bleeds or crusts — needs attention.',
  },
  {
    m: 'Module 4 · Clinical Red Flags',
    q: "The 'D' in ABCDE refers to diameter. Melanomas are often larger than roughly:",
    opts: ['2 mm', '6 mm', '15 mm', '25 mm'],
    a: 1,
    e: "Often larger than 6 mm (about a pencil-end), but size alone isn't diagnostic — a small lesion with other features should still be flagged.",
  },
  {
    m: 'Module 4 · Clinical Red Flags',
    q: "What does the 'ugly duckling sign' describe?",
    opts: ['A mole that has always looked unusual since birth', "A mole that stands out as obviously different from a person's other moles", 'Any mole larger than 6 mm', 'A mole that has completely disappeared'],
    a: 1,
    e: "Most of a person's moles look broadly similar. The one that clearly stands out is the 'ugly duckling' and warrants attention — no equipment needed.",
  },
  {
    m: 'Module 4 · Clinical Red Flags',
    q: 'Which is a red flag suggesting a possible BCC or SCC rather than melanoma?',
    opts: ['A uniformly brown, symmetrical mole', "A persistent sore that doesn't heal within three to four weeks", 'A freckle that fades in winter', 'A mole identical to all the others'],
    a: 1,
    e: 'Non-melanoma red flags include a non-healing sore (3–4 weeks), a pearly/translucent bump, a scar-like patch, or a firm red nodule on sun-exposed skin.',
  },
  // ---- Module 5: Referral & conversations ----
  {
    m: 'Module 5 · Referral & Conversations',
    q: 'Which phrase should you AVOID when raising a concern with a patient?',
    opts: ['“It’s probably nothing, but it’s worth getting checked”', '“I think that might be cancer”', '“A skin specialist could take a quick look, just to be safe”', '“Changes to moles are worth getting checked sooner rather than later”'],
    a: 1,
    e: "Avoid alarming language like 'that might be cancer' — you're not diagnosing. Also avoid 'I'm sure it's fine,' which may discourage a needed check.",
  },
  {
    m: 'Module 5 · Referral & Conversations',
    q: 'Which is a correct statement about referral pathways?',
    opts: ['Patients must always wait for a GP referral before any skin check', 'Patients can self-refer to a specialist clinic like The MOLE Clinic without a GP referral', 'Only hospitals can perform mole mapping', 'The two-week-wait pathway is the only option available'],
    a: 1,
    e: 'Patients can see their GP (who may use the NHS two-week-wait pathway) OR self-refer directly to a specialist clinic like The MOLE Clinic, often much sooner.',
  },
]

export const PASS_MARK = Math.ceil((PASS_PERCENT / 100) * QUESTIONS.length) // 16 of 20
