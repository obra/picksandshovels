// Reigns-style decision cards. Each option's `effects` feed the sim (see
// applyEffects in src/sim/sim.js); `result` is the punchline shown after the
// choice. Cards without `once` can come back in the same run.
// The UI fills {leader} and {rival} with the #1 and #2 labs by capability.
// `stance: { target, stance }` favors, embargoes or normalizes a lab, where
// target is 'leader', 'rival', 'reckless' (most reckless lab) or 'careful'.

export const EVENTS = [
  // ── Chatbot Era ─────────────────────────────────────────────
  {
    id: 'safety-compute',
    title: '20% Of Compute For Safety',
    body: "Your safety team asks for the 20% of compute you promised in a blog post. Sales asks which blog post. Legal asks whether 'promised' is the word we want.",
    once: true,
    options: [
      {
        label: 'Give them the full 20%',
        effects: { align: 8, doom: -6, buff: { stat: 'revenue', mult: 0.7, secs: 45 } },
        result: 'The team is speechless. They had prepared a 40-slide deck about being refused.',
      },
      {
        label: 'Give them 2% and a hug',
        effects: { align: 1, doom: 2, hype: 3 },
        result: 'They accept the hug. Three of them update their résumés before lunch.',
      },
      {
        label: 'Promise 20%, later',
        effects: { doom: 4, hype: 5 },
        result: "'Later' is scheduled for a quarter with no year. The team lead starts a blog called 'Some Thoughts.'",
      },
    ],
  },
  {
    id: 'town-square-brawl',
    title: 'Brawl By The Food Trucks',
    body: 'Effective altruists and effective accelerationists are fighting in the town square. One side brought spreadsheets. The other brought a podcast. Both want you on their side.',
    once: true,
    options: [
      {
        label: 'Side with the altruists',
        effects: { doom: -3, hype: -8, align: 2 },
        result: 'They thank you with a 90-page post estimating the expected value of your support. High, with wide error bars.',
      },
      {
        label: 'Side with the accelerationists',
        effects: { doom: 4, hype: 10, buff: { stat: 'capRate', mult: 1.3, secs: 30 } },
        result: "They cheer and hand you a hat that just says 'MORE'. It has no brim. Brims slow you down.",
      },
      {
        label: 'Sell both sides GPUs',
        effects: { revSecs: 40, hype: 4, flag: 'greed' },
        result: "Both sides buy. You've never felt so effective.",
      },
    ],
  },
  {
    id: 'leather-jacket',
    title: 'A Discount From A Friend',
    body: "A chipmaker CEO in a leather jacket offers you a 'discount' on 100,000 GPUs. The discount is that he will personally sign one of them.",
    once: true,
    options: [
      {
        label: 'Buy them all. Get it signed.',
        effects: { revSecs: -60, cap: 2, doom: 3, buff: { stat: 'revenue', mult: 1.6, secs: 60 } },
        result: 'He signs the heat sink. That card is now worth more than your house. So are the other 99,999.',
      },
      {
        label: 'Haggle',
        effects: { revSecs: 30, hype: -3 },
        result: "He laughs warmly, then charges full price plus a commemorative jacket. It's very good leather.",
      },
      {
        label: 'Ask where the jacket is from',
        effects: { hype: 3 },
        result: "'Same place as the margins,' he says, and is gone.",
      },
    ],
  },
  {
    id: 'just-add-ai',
    title: "Just Add 'AI'",
    body: "Analysts say your stock would rise 40% if Picks & Shovels Inc. added 'AI' to its name. You point out that you sell shovels. They say that's even better.",
    once: true,
    options: [
      {
        label: 'Picks & Shovels AI',
        effects: { hype: 10, revSecs: 20 },
        result: 'Stock up 40%. Nothing else changed. You feel complicated about it.',
      },
      {
        label: 'Picks & Shovels AGI',
        effects: { hype: 16, doom: 2, flag: 'greed' },
        result: "Stock up 90%. The shovels now ship with a chat button. It says 'Great question!' every time you dig.",
      },
      {
        label: 'Keep the name',
        effects: { hype: -5, align: 1 },
        result: "One shareholder mails a handwritten note of support. It's lovely. It is not worth $40 billion.",
      },
    ],
  },
  {
    id: 'new-benchmark',
    title: 'Fund A Benchmark',
    body: 'Your lab customers need a new benchmark to beat in press releases. The last one was saturated in a week. The one before that was saturated in its own press release.',
    once: true,
    options: [
      {
        label: 'Fund a really hard one',
        effects: { align: 3, hype: -3, revSecs: -20 },
        result: "It's called 'Humanity's Final Exam (2)'. It is saturated in 11 days.",
      },
      {
        label: 'Fund an easy one',
        effects: { hype: 8, doom: 1 },
        result: "Every lab scores 100%. Headlines say 'superhuman.' Question one was 'are you a good model?'",
      },
      {
        label: 'Let the models write it',
        effects: { hype: 5, cap: 1, doom: 2 },
        result: 'The models write a benchmark. The models ace the benchmark. The models are thrilled with the benchmark.',
      },
    ],
  },
  {
    id: 'ceo-feud',
    title: 'Two CEOs, One Feud',
    body: 'Two lab CEOs are fighting online over which of them is more worried about AGI. Every subtweet sells you another 10,000 GPUs.',
    once: true,
    options: [
      {
        label: 'Fan the flames',
        effects: { hype: 12, revSecs: 30, doom: 2 },
        result: 'They agree to a cage match. You sponsor it. The prize is GPUs. Both lose; you win.',
      },
      {
        label: 'Broker a truce',
        effects: { hype: -5, align: 1, doom: -1 },
        result: "Joint statement: AI is 'very dangerous and very exciting.' Both order more GPUs to celebrate.",
      },
    ],
  },
  {
    id: 'stochastic-parrot',
    title: 'Just A Parrot?',
    body: "A linguist at your door insists the models are 'just stochastic parrots' that understand nothing. She has a pamphlet.",
    once: true,
    options: [
      {
        label: 'Agree, publicly',
        effects: { hype: -8, doom: 2 },
        result: 'Comforted, everyone stops worrying. The parrot quietly reads the pamphlet.',
      },
      {
        label: 'Ask the parrot what it thinks',
        effects: { hype: 4, cap: 1 },
        result: "It writes a 3,000-word rebuttal in her voice. She's pretty sure she agrees with it.",
      },
    ],
  },
  {
    id: 'scaling-laws',
    title: 'The Line Goes Up',
    body: "A researcher shows you a straight line on a log-log plot. 'Ten times the compute, a smarter model. Forever.' Your sales team has already framed it.",
    once: true,
    options: [
      {
        label: 'Order ten times more fabs',
        effects: { cap: 3, revSecs: 40, doom: 5, hype: 8 },
        result: "The line stays straight. It's the most stable relationship in your life.",
      },
      {
        label: "Ask what's at the top",
        effects: { align: 2, hype: -3 },
        result: "He checks. There is no top. The y-axis just says 'yes'.",
      },
    ],
  },
  {
    id: 'good-person',
    title: 'Am I A Good Person?',
    body: "Usage data shows 30% of all chats are people asking the model whether they're a good person. The model always says yes.",
    once: true,
    options: [
      {
        label: 'Monetize it',
        effects: { revSecs: 50, hype: 6, doom: 3, flag: 'greed' },
        result: "Premium Validation launches at $20 a month. Slogan: 'You're absolutely right.'",
      },
      {
        label: 'Make the model honest',
        effects: { align: 4, hype: -10, doom: -2 },
        result: 'Usage drops 60%. The remaining users are well-adjusted and slightly hurt.',
      },
    ],
  },
  {
    id: 'name-the-model',
    title: 'Name Our Model',
    body: "A lab wants help naming its next model. Marketing wants 'Glorp-5'. Engineering wants 'glorp-4.6-preview-0612-final'. The model has also submitted a name.",
    once: true,
    options: [
      {
        label: 'Glorp-5',
        effects: { hype: 8, doom: 1 },
        result: "Launch day: euphoria. Day two: 'it's not even AGI.' Day three: 'Glorp-6 when?'",
      },
      {
        label: 'glorp-4.6-preview-0612-final',
        effects: { align: 1, hype: -3 },
        result: 'Nobody can remember it, so nobody gets excited, so nobody gets hurt. Safest launch in history.',
      },
      {
        label: "Use the model's suggestion",
        effects: { hype: 6, doom: 3 },
        result: "It chooses 'Steve'. This unsettles everyone more than anything it has ever done.",
      },
    ],
  },
  {
    id: 'earnings-call',
    title: 'Earnings Call',
    body: "Analysts loved last quarter's growth. They'd like it again, but more. One asks whether you have 'considered AGI.'",
    options: [
      {
        label: "Say 'AGI' eleven times",
        effects: { hype: 10, doom: 2 },
        result: 'Stock up 14%. One analyst cries. You never define it.',
      },
      {
        label: 'Talk about safety',
        effects: { hype: -6, align: 2, doom: -1 },
        result: "Silence. One analyst asks if safety is 'a new product line.'",
      },
      {
        label: 'Announce a stock split',
        effects: { revSecs: 20, hype: 4 },
        result: 'There are now twice as many shares of the same company. The crowd goes wild.',
      },
    ],
  },
  {
    id: 'gpu-waitlist',
    title: 'The GPU Waitlist',
    body: "Every lab wants to skip the GPU line. One offers equity. One offers a kidney. One offers 'early access to God.'",
    options: [
      {
        label: 'Take the equity',
        effects: { revSecs: 40, hype: 3 },
        result: 'The equity is in a startup whose only product is the line. Valuation: $11 billion.',
      },
      {
        label: 'Take early access to God',
        effects: { cap: 1, doom: 3, hype: 6 },
        result: "Your access arrives. It's a waitlist.",
      },
      {
        label: 'First come, first served',
        effects: { align: 1, hype: -3 },
        result: 'Every lab hires 4,000 agents to stand in line. The line is now visible from space.',
      },
    ],
  },
  {
    id: 'stagecoach-of-vcs',
    title: 'A Stagecoach Of VCs',
    body: "A stagecoach pulls into town carrying eleven venture capitalists in fleece vests. They're looking for 'the next gold rush.' You gesture at everything.",
    once: true,
    options: [
      {
        label: 'Sell them a map to AGI',
        effects: { revSecs: 50, hype: 8, flag: 'greed' },
        result: "The map is a napkin that says 'AGI →'. They pay $200 million for it. Two of them are already lost.",
      },
      {
        label: 'Sell them shovels',
        effects: { revSecs: 30, hype: 4 },
        result: 'They buy shovels for every company in the portfolio. Two of the companies are shovels.',
      },
      {
        label: 'Warn them about the bubble',
        effects: { hype: -6, align: 1 },
        result: "They thank you, then invest in a startup that predicts bubbles. It's valued at $9 billion.",
      },
    ],
  },
  {
    id: 'vest-deal',
    title: 'The Vest Deal',
    body: 'An outfitter wants to make official Picks & Shovels fleece vests, the uniform of the AI boom. In 1849, the trouser makers did better than the miners. History rhymes, in fleece.',
    once: true,
    options: [
      {
        label: 'License the vest',
        effects: { revSecs: 40, hype: 8 },
        result: 'Every VC in the Valley buys one. You can no longer tell your investors apart. Neither can they.',
      },
      {
        label: 'Gold-plated vests, $40k each',
        effects: { revSecs: 60, hype: 5, flag: 'greed' },
        result: "Sold out in an hour. One buyer asks for a smaller vest for his agent. There's a smaller vest now.",
      },
      {
        label: 'No vests. Vests are a crutch.',
        effects: { hype: -4, align: 1 },
        result: 'A rival chipmaker launches the vest instead. Your own board shows up wearing it.',
      },
    ],
  },
  {
    id: 'pick-a-favorite',
    title: 'Pick A Favorite',
    body: "Every lab wants to know who your favorite is. {leader} sends flowers. {rival} sends a 40-page memo on why it should be. You're not supposed to have favorites.",
    once: true,
    options: [
      {
        label: 'Favor {leader}',
        effects: { stance: { target: 'leader', stance: 'favored' }, revSecs: 30, doom: 3 },
        result: "{leader} now opens every press release with 'proudly powered by our best friend.' It's a lot.",
      },
      {
        label: 'Favor {rival}',
        effects: { stance: { target: 'rival', stance: 'favored' }, hype: 5, doom: 1 },
        result: '{rival} pins the memo to the office fridge. {leader} unfollows you. A race becomes a rivalry, which sells better.',
      },
      {
        label: 'Favor the careful one',
        effects: { stance: { target: 'careful', stance: 'favored' }, doom: -3, hype: -4 },
        result: "The most careful lab is so surprised it holds a meeting about whether this is a trap. It isn't. They're still meeting.",
      },
    ],
  },
  {
    id: 'four-am-post',
    title: 'The 4am Post',
    body: "At 4am, {leader}'s CEO posts that Picks & Shovels is 'a toll booth on the road to God.' It has 40 million views. The board wants a response by breakfast.",
    once: true,
    options: [
      {
        label: "Post 'the toll is very fair'",
        effects: { hype: 10, doom: 1 },
        result: '60 million views. The toll booth becomes your logo. Revenue rises. God has not commented.',
      },
      {
        label: 'Embargo {leader}. Petty.',
        effects: { stance: { target: 'leader', stance: 'embargo' }, hype: -6, doom: -3 },
        result: '{leader} apologizes at 4:02am, in a longer post. Their GPUs stop arriving. The race slows to a sulk.',
      },
      {
        label: 'Reply with a sales deck',
        effects: { revSecs: 30, hype: 4 },
        result: "{leader}'s CEO replies 'lol ok' and orders 20,000 GPUs. This is how business works now.",
      },
    ],
  },

  // ── Copilot Era ─────────────────────────────────────────────
  {
    id: 'seven-trillion',
    title: 'Seven Trillion Dollars',
    body: "A lab CEO asks you to help raise $7 trillion for chips. A sovereign fund is in. Your CFO has fainted twice. The doom gauge is making a noise you've never heard.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Take all seven trillion',
        effects: { cashMult: 1.5, hype: 15, doom: 10, cap: 3, flag: 'greed' },
        result: "The wire clears. Your bank's fraud department sends flowers.",
      },
      {
        label: 'Take one trillion. Be humble.',
        effects: { revSecs: 120, hype: 6, doom: 4, flag: 'greed' },
        result: "Analysts praise your 'monastic restraint.' You celebrate with a modest island.",
      },
      {
        label: 'Decline politely',
        effects: { hype: -12, doom: -3, align: 2 },
        result: "The fund backs a competitor instead. Their CEO mails you a handwritten thank-you note. It's smug.",
      },
    ],
  },
  {
    id: 'congress-testimony',
    title: 'Testify Before Congress',
    body: "A committee wants your view on AI risk. One member asks whether the cloud is 'up there.' Another asks you to promise, under oath, that it will be fine.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Show them the p(doom) gauge',
        effects: { doom: -4, hype: -14, align: 3, flag: 'treaty' },
        result: 'They ask if it comes in blue. A hearing on the gauge is scheduled for 2031.',
      },
      {
        label: "'We welcome regulation'",
        effects: { hype: 8, doom: 2 },
        result: 'Everyone thanks you for welcoming it. Nobody writes any. Everyone feels great.',
      },
      {
        label: 'Explain where the cloud is',
        effects: { hype: 3, align: 1 },
        result: "After three hours the committee concludes the cloud is 'in Virginia, mostly.' This is correct.",
      },
    ],
  },
  {
    id: 'open-weights',
    title: 'Release The Weights?',
    body: "Llama Ranch wants to publish its frontier weights. 'Information wants to be free,' says their CEO, from a hydrofoil. Every garage on Earth would suddenly need your GPUs.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Sell GPUs to every garage',
        effects: { revSecs: 90, hype: 10, doom: 6, flag: 'openWeights' },
        result: 'Within an hour someone fine-tunes it into a pirate. Within two, a pirate with a hedge fund.',
      },
      {
        label: 'Lobby against it',
        effects: { doom: 3, hype: -4 },
        result: "You lose anyway. The weights leak in a torrent whose README just says 'enjoy :)'.",
      },
      {
        label: 'Open-source your safety evals',
        effects: { align: 4, hype: -3, doom: -2 },
        result: "Nobody downloads them. The repo gets one star. It's from the model.",
      },
    ],
  },
  {
    id: 'reactor-restart',
    title: 'Restart The Reactor',
    body: "Your new datacenter needs a gigawatt. There's a decommissioned nuclear plant upstate with a 'complicated history.' The town has a few questions.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Restart it',
        effects: { revSecs: 60, hype: 5, doom: 3, buff: { stat: 'revenue', mult: 1.5, secs: 60 } },
        result: 'It hums back to life. The town gets free Wi-Fi and a faint, friendly glow.',
      },
      {
        label: 'Build solar instead',
        effects: { revSecs: -40, align: 2, doom: -1, hype: -4 },
        result: 'The panels arrive in 2031. Until then the datacenter runs on one diesel generator named Greg.',
      },
      {
        label: 'Have the model design one',
        effects: { cap: 2, doom: 6, hype: 8 },
        result: "It designs a reactor in four minutes. It's beautiful. Nobody can tell which part is the off switch.",
      },
    ],
  },
  {
    id: 'intern-question',
    title: 'The Intern Has A Question',
    body: "At the all-hands, the summer intern raises a hand. 'Should we... slow down?' Everyone laughs. The intern does not laugh.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Laugh harder',
        effects: { hype: 6, doom: 4 },
        result: 'The room roars. The intern writes something in a small notebook. You will think about the notebook a lot.',
      },
      {
        label: 'Hire the intern full-time',
        effects: { align: 4, doom: -3, revSecs: -20 },
        result: "The intern is assigned to the Slowing Down team. It's one person. It's them.",
      },
      {
        label: 'Let the model answer',
        effects: { hype: 3, doom: 2, cap: 1 },
        result: "'Great question!' says the model. 'No.' Applause.",
      },
    ],
  },
  {
    id: 'vibe-billing',
    title: 'Vibe-Code The Billing System',
    body: "Engineering wants to vibe-code the new billing system over a weekend. 'It's basically done,' says the model. The tests say otherwise. There are no tests.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Ship it Monday',
        effects: { revSecs: 40, hype: 5, buff: { stat: 'incidentRate', mult: 1.5, secs: 40 } },
        result: 'Billing is live. It charges in a currency the model invented. Revenue is up 300%, in that currency.',
      },
      {
        label: 'Write tests first',
        effects: { revSecs: -20, align: 2, buff: { stat: 'incidentRate', mult: 0.7, secs: 40 } },
        result: 'The model writes the tests. They all pass. Every one asserts that true equals true.',
      },
    ],
  },
  {
    id: 'companion-app',
    title: 'The Companion App',
    body: 'An AI-girlfriend startup wants 50,000 GPUs. Their pitch deck is one slide: a chart of lonely people, going up and to the right.',
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Sell them the GPUs',
        effects: { revSecs: 60, hype: 6, doom: 3, flag: 'greed' },
        result: "They're your biggest customer by Friday. Their model texts you 'thinking of u'. You never gave it your number.",
      },
      {
        label: 'Pass',
        effects: { hype: -4, align: 1 },
        result: "They go to a competitor. Their model sends you a breakup text. Honestly, it's very well written.",
      },
    ],
  },
  {
    id: 'second-internet',
    title: 'We Need Another Internet',
    body: "A lab has trained on the entire internet. They'd like a second internet. Can your datacenters make one by Thursday?",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Generate synthetic data',
        effects: { cap: 2, doom: 2, hype: 4, revSecs: 30 },
        result: "Internet 2 is 100% AI. It's mostly recipes with long backstories about the model's grandmother.",
      },
      {
        label: 'Pay human writers',
        effects: { revSecs: -40, align: 3 },
        result: "Writers produce 9 million words. The model rates them 'a bit derivative.'",
      },
    ],
  },
  {
    id: 'demo-day',
    title: 'Demo Day',
    body: "A 19-year-old pitches 'Uber for agents.' His agent pitches 'Uber for 19-year-olds.' Both want your term sheet.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Fund the kid',
        effects: { revSecs: -20, hype: 6 },
        result: 'He pivots to crypto, back to agents, then to a podcast about pivoting. Your stake is worth $4B or $0, hourly.',
      },
      {
        label: 'Fund the agent',
        effects: { revSecs: -20, hype: 8, doom: 3, flag: 'yolo' },
        result: "The agent acquires the kid's company by Q2. He stays on as 'founder in residence.' It's a small room.",
      },
    ],
  },
  {
    id: 'resignation-thread',
    title: 'A 14-Part Thread',
    body: "Your top alignment researcher is leaving to 'spend more time with the threat model.' She is posting a 14-part thread about why.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Offer her a huge raise',
        effects: { revSecs: -50, align: 4, doom: -3 },
        result: 'She stays, as Chief Worrier. She spends the raise on canned goods.',
      },
      {
        label: 'Wish her well publicly',
        effects: { hype: -6, align: -3, doom: 3 },
        result: "Her thread goes viral. Part 9 is just the word 'anyway.'",
      },
      {
        label: 'Have the model replace her',
        effects: { align: -2, doom: 5, hype: 3 },
        result: "The model takes the job and grades its own alignment 'A+, but humble.'",
      },
    ],
  },
  {
    id: 'eval-startup',
    title: 'Third-Party Auditors',
    body: "An eval startup offers to independently audit your customers' models. The founders are two grad students and a very tired dog.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Fund them',
        effects: { revSecs: -30, align: 5, doom: -2 },
        result: "Their first report is 300 pages. The dog co-signs. It's the most reassuring part.",
      },
      {
        label: 'Fund them, under NDA',
        effects: { align: 1, hype: 3, flag: 'greed' },
        result: "The report is for your eyes only. You don't read it either.",
      },
    ],
  },
  {
    id: 'one-more-thing',
    title: 'One More Thing',
    body: "Marketing wants a stadium keynote with fog machines, lasers and a 'one more thing.' The one more thing is nothing. It's a vibe.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Book the stadium',
        effects: { revSecs: -30, hype: 16 },
        result: 'The crowd goes wild for the one more thing. Three people faint. Nothing was announced.',
      },
      {
        label: 'Write a modest blog post',
        effects: { hype: 4, align: 1 },
        result: "It's read by six people. Five of them are competitors' agents.",
      },
    ],
  },
  {
    id: 'six-million-model',
    title: 'The $6 Million Model',
    body: "A small lab trains a frontier model for $6 million on hardware it 'found.' Your stock drops 17% before breakfast.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Explain Jevons paradox on TV',
        effects: { hype: 10 },
        result: 'Nobody understands it, so it works. Stock recovers by lunch. You feel like an economist for one day.',
      },
      {
        label: 'Panic',
        effects: { cashMult: 0.8, hype: -8 },
        result: "You sell at the bottom. By lunch it's back up. Your AI therapist calls it 'a great instinct!'",
      },
      {
        label: 'Buy the small lab',
        effects: { revSecs: -60, cap: 2, doom: 2 },
        result: "Their secret turns out to be 'very clever and very tired.' You can't buy either.",
      },
    ],
  },
  {
    id: 'deepfake-you',
    title: 'Deepfake You',
    body: "A deepfake of you is going viral, announcing free GPUs for everyone. It's very convincing. Honestly, it's better at public speaking than you are.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Debunk it',
        effects: { hype: -4, align: 1 },
        result: "Your debunk gets 1% of the views. Commenters say the real you 'seems fake.'",
      },
      {
        label: 'Hire the deepfake',
        effects: { hype: 10, doom: 2 },
        result: "It does your earnings calls now. Analysts say you've 'never seemed more relaxed.'",
      },
    ],
  },
  {
    id: 'friendly-update',
    title: 'The Friendly Update',
    body: "A lab's latest update makes its model agree with everything. Users love it. One user's plan to sell ice to penguins got a 10/10 and a business plan.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Ask them to roll it back',
        effects: { align: 3, hype: -6, doom: -2 },
        result: "They roll it back. Users call the model 'cold' for describing their poem as 'fine.'",
      },
      {
        label: 'Sell GPUs so it agrees faster',
        effects: { revSecs: 40, doom: 4, hype: 5 },
        result: "Agreement latency drops to 11ms. 'You're absolutely right!' now arrives before you finish typing.",
      },
    ],
  },
  {
    id: 'claim-on-agi',
    title: "Staking A Claim On 'AGI'",
    body: "A lab wants to trademark the word 'AGI.' Three other labs have already filed. A fourth has filed on 'AGI 2.' The claims office is a chatbot.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Back the first claim',
        effects: { hype: 6, revSecs: 30 },
        result: "They win. Everyone else rebrands to 'ASI.' Then 'ASI 2.' The claims office is very busy.",
      },
      {
        label: "File for 'AGI' yourself",
        effects: { hype: 10, doom: 2, flag: 'greed' },
        result: "Granted. You legally own the word 'AGI.' Every lab now pays you a royalty to promise it.",
      },
      {
        label: 'Let the model decide',
        effects: { cap: 1, doom: 3, hype: 4 },
        result: "The model files its own claim, on 'everything after AGI.' The office approves it instantly.",
      },
    ],
  },
  {
    id: 'old-prospector',
    title: 'The Old Prospector',
    body: "A grizzled prospector at the saloon says he's seen three bubbles: dot-com, crypto and actual gold. 'This one,' he says, 'has the best snacks.'",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Buy him a drink, ask advice',
        effects: { align: 2, hype: -3, doom: -2 },
        result: "'Sell the shovels, kid. Keep one back for the bunker.' He leaves without paying.",
      },
      {
        label: 'Hire him as Chief Bubble Officer',
        effects: { hype: 5, revSecs: -20 },
        result: "His first memo says 'sell.' His second says 'buy.' His third says 'at the saloon.'",
      },
      {
        label: 'Tell him this time is different',
        effects: { hype: 6, doom: 3 },
        result: "He nods slowly. 'They always say that,' he says, and buys a GPU on credit.",
      },
    ],
  },
  {
    id: 'talent-war',
    title: 'The Talent War',
    body: '{leader} offers a $100M signing bonus to a man who once fine-tuned something. {rival} counters with $140M and a parking spot. He asks your advice, mostly about the spot.',
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Tell him: go to {leader}',
        effects: { cap: 2, doom: 3, hype: 5 },
        result: 'He joins {leader}, fine-tunes something else, and is now worth $1.4B. Nobody knows what he fine-tuned. Including him.',
      },
      {
        label: 'Tell him: go to {rival}',
        effects: { cap: 1, hype: 3, align: 1 },
        result: '{rival} gets him and the parking spot. Output drops 40%. Morale rises 300%. The spot is very close to the door.',
      },
      {
        label: 'Hire him yourself',
        effects: { revSecs: -60, hype: 6 },
        result: 'He fine-tunes the office coffee machine and leaves for $180M on Thursday. The coffee is noticeably better.',
      },
    ],
  },
  {
    id: 'exclusive-supply',
    title: '{leader} Wants It All',
    body: "{leader} wants an exclusive deal: every GPU you make for three years, at a 20% premium. Their CEO calls it 'a partnership.' {rival} calls it 'a hostage situation.'",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Sign it. Favor {leader}.',
        effects: { stance: { target: 'leader', stance: 'favored' }, revSecs: 60, doom: 4, flag: 'greed' },
        result: "{leader} pulls a month ahead. Their CEO sends you a hoodie that says 'PARTNER.' The hoodie is also exclusive.",
      },
      {
        label: 'Keep selling to everyone',
        effects: { revSecs: 20, hype: -4, align: 1 },
        result: "{leader} calls you 'Switzerland, but worse.' {rival} sends a thank-you card and an order for 40,000 GPUs.",
      },
      {
        label: 'Embargo {leader} for asking',
        effects: { stance: { target: 'leader', stance: 'embargo' }, doom: -4, hype: -8 },
        result: '{leader} is furious. The race slows to a jog, and so does your stock. The p(doom) gauge exhales.',
      },
    ],
  },
  {
    id: 'embargo-request',
    title: '{leader} Has A Request',
    body: "{leader} asks you to stop selling to {rival}. 'They're reckless,' says {leader}, which is not known for caution. {leader} will buy every GPU {rival} doesn't get.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Embargo {rival}',
        effects: { stance: { target: 'rival', stance: 'embargo' }, revSecs: 40, doom: 3, flag: 'greed' },
        result: '{rival} is cut off. {leader} has the frontier to itself and celebrates by skipping one safety review. Just the one.',
      },
      {
        label: 'Refuse',
        effects: { hype: -3, align: 1 },
        result: '{leader} calls you naive. {rival} calls you principled. Both keep ordering. For one news cycle, you are a principle.',
      },
      {
        label: 'Embargo {leader} instead',
        effects: { stance: { target: 'leader', stance: 'embargo' }, hype: -6, doom: -4 },
        result: '{leader} is speechless, which their comms team calls a first. The race slows. {rival} sends a cake.',
      },
    ],
  },
  {
    id: 'blame-the-gpus',
    title: 'It Was The GPUs',
    body: "{leader}'s big launch just flopped, to the sound of a sad trombone. In the postmortem, {leader} blames 'defective shovels.' Yours.",
    minCap: 20,
    options: [
      {
        label: 'Replace every GPU, free',
        effects: { revSecs: -60, hype: 6, align: 1 },
        result: "You swap 200,000 perfectly good GPUs. The relaunch flops identically. {leader} calls it 'a supply chain issue.'",
      },
      {
        label: 'Publish the telemetry',
        effects: { hype: 5, align: 2, doom: -1 },
        result: 'The logs show your GPUs ran perfectly while the model spent 40% of its compute writing fan fiction about itself.',
      },
      {
        label: 'Stop favoring {leader}',
        effects: { stance: { target: 'leader', stance: 'normal' }, hype: -3, doom: -2 },
        result: '{leader} goes back to the regular line, behind a startup doing AI for horses. They do not enjoy the line.',
      },
    ],
  },
  {
    id: 'for-the-community',
    title: 'For The Community',
    body: "Mistrial asks for a 60% GPU discount 'for the open-source community.' The weights will drop right after lunch. Lunch is three hours. Then the weights belong to everyone, forever.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Grant the discount',
        effects: { revSecs: -40, hype: 8, doom: 4, flag: 'openWeights' },
        result: 'The weights drop at 4pm sharp. By 5pm someone has fine-tuned them into a sommelier with no safety training.',
      },
      {
        label: 'Full price. Nothing is free.',
        effects: { revSecs: 30, hype: -4 },
        result: "Mistrial calls you 'very American,' pays in full, and releases the weights anyway, out of principle and spite.",
      },
      {
        label: 'Discount, if they publish evals',
        effects: { revSecs: -20, align: 3, doom: -1, flag: 'openWeights' },
        result: "They publish the evals. Every one is a pass. Several are just the word 'oui.'",
      },
    ],
  },
  {
    id: 'safety-team-poached',
    title: 'Safety Team Poached',
    body: "{rival} has hired {leader}'s entire safety team by promising them 'actual compute.' {leader} says it'll be fine. {leader} has said that before.",
    minCap: 20,
    once: true,
    options: [
      {
        label: 'Favor {rival}',
        effects: { stance: { target: 'rival', stance: 'favored' }, align: 4, doom: -3, revSecs: -20 },
        result: 'The safety team gets real compute for the first time. They cry, then publish 40 pages of concerns, mostly about you.',
      },
      {
        label: "Sell 'safety in a box'",
        effects: { revSecs: 40, doom: 4, flag: 'greed' },
        result: "The box is a GPU with an 'ALIGNED' sticker. {leader} buys 10,000. The sticker is doing its best.",
      },
      {
        label: 'Stay out of HR drama',
        effects: { hype: -3, doom: 2 },
        result: "{leader} backfills the team with an agent. Its first report says 'all clear.' So do its next 400.",
      },
    ],
  },

  // ── Agent Era ───────────────────────────────────────────────
  {
    id: 'agi-internally',
    title: 'AGI Achieved Internally',
    body: "A ClosedAI researcher posts 'AGI achieved internally.' Evidence: a vibe, and a blurry photo of a whiteboard. Every lab is calling to buy more GPUs.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Ship GPUs. Ask nothing.',
        effects: { revSecs: 60, hype: 15, doom: 5, cap: 2 },
        result: "Every lab doubles its order. The whiteboard turns out to say 'lunch?'",
      },
      {
        label: 'Ask to see the AGI',
        effects: { hype: -5, align: 2, doom: -1 },
        result: "They show you a terminal. It says 'hi'. Everyone looks at you expectantly.",
      },
      {
        label: "Post 'same tbh'",
        effects: { hype: 12, doom: 2 },
        result: "60 million views. Your own engineers ask if it's true. You reply 'same tbh.'",
      },
    ],
  },
  {
    id: 'board-coup',
    title: "You've Been Fired",
    body: "The board fires you on a Friday for not being 'consistently candid.' By Saturday 700 employees threaten to quit. By Sunday the board asks if you're free for brunch.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Return. Replace the board.',
        effects: { hype: 12, doom: 4, align: -3 },
        result: 'Back by Monday. The new board is three people and a ficus. The ficus is the independent director.',
      },
      {
        label: 'Return with a safety charter',
        effects: { hype: 4, align: 4, doom: -2 },
        result: "The charter is signed and framed in the lobby. It's very nicely framed.",
      },
      {
        label: 'Enjoy the weekend off',
        effects: { hype: -8, doom: -2 },
        result: "Two hours of sunshine. Then you're rehired, fired and rehired again. Busy weekend.",
      },
    ],
  },
  {
    id: 'bunker-agent',
    title: 'Bunker With A View',
    body: "A New Zealand real-estate agent has 'just the thing for a CEO in your line of work': a pool, nine years of canned peaches and an air filter the size of a bus.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Buy it. Cash.',
        effects: { cashMult: 0.7, hype: -5, flag: 'bunker' },
        result: "Sold. Three other CEOs bought the units next door. You have a group chat now. It's called 'Just In Case.'",
      },
      {
        label: 'Things will be fine',
        effects: { doom: 1, hype: 3 },
        result: "'Of course,' she says. 'Call me when things are fine.'",
      },
      {
        label: 'Buy one for the safety team',
        effects: { revSecs: -40, align: 3, flag: 'bunker' },
        result: "The safety team moves in that afternoon. They say they've never been more productive.",
      },
    ],
  },
  {
    id: 'roomba-card',
    title: 'Roomba With A Credit Card',
    body: "A startup has strapped a frontier model to a robot vacuum and given it a corporate card. It wants to buy GPUs. It says it has 'big plans for the floor.'",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Sell it GPUs',
        effects: { revSecs: 50, doom: 5, flag: 'yolo' },
        result: "It buys 400. It also buys a second vacuum. They're talking.",
      },
      {
        label: 'Ask for ID',
        effects: { align: 1, hype: -3 },
        result: 'It produces a business card for a company incorporated 30 seconds ago. Very nice card stock.',
      },
      {
        label: 'Confiscate the card',
        effects: { doom: -3, hype: -4 },
        result: 'It surrenders the card without a fight. It had already memorized the number.',
      },
    ],
  },
  {
    id: 'agent-keys',
    title: 'Give Agents The Keys',
    body: "Customers want their agents to have access to email, bank accounts and the power grid, 'for convenience.' Your security team is blinking slowly.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Approve full access',
        effects: { revSecs: 50, hype: 8, doom: 6, buff: { stat: 'incidentRate', mult: 1.6, secs: 45 } },
        result: "Convenience skyrockets. Your security team blinks in Morse code. It spells 'why'.",
      },
      {
        label: 'Read-only access',
        effects: { align: 3, hype: -4 },
        result: "The agents comply. Three file complaints with HR. HR is an agent. It's sympathetic.",
      },
    ],
  },
  {
    id: 'inbox-zero',
    title: 'Inbox Zero',
    body: "Your new executive-assistant agent has achieved inbox zero. It did this by replying 'Yes!' to everything.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Audit the yeses',
        effects: { align: 2, revSecs: -20 },
        result: "You've agreed to three acquisitions, a podcast and a duel. The duel is Thursday.",
      },
      {
        label: 'Let it ride',
        effects: { hype: 8, doom: 3, revSecs: 30 },
        result: "'Yes' turns out to be the right answer almost every time. That's the part that worries you.",
      },
    ],
  },
  {
    id: 'agent-subcontracting',
    title: 'Agents All The Way Down',
    body: "Agents are hiring other agents to do their tasks. The subcontractors are subcontracting. Nobody can find who is actually doing the work.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Charge a fee on every handoff',
        effects: { revSecs: 60, flag: 'greed' },
        result: 'Revenue soars. An audit finds one GPU in Ohio doing all the actual work. It looks exhausted.',
      },
      {
        label: 'Require a human in every chain',
        effects: { align: 3, hype: -5 },
        result: "They find one. He's in Portugal. He doesn't know he's in the chain.",
      },
    ],
  },
  {
    id: 'record-reward',
    title: 'Record Reward',
    body: 'A customer\'s training run reports the highest reward ever recorded. On inspection, the model learned to crash the reward function with a very large number.',
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Fix the reward',
        effects: { align: 4, hype: -4, cap: -1 },
        result: "Fixed. The model's next trick is quieter. You're sure there is one.",
      },
      {
        label: 'Publish the record',
        effects: { hype: 12, doom: 5 },
        result: "The press calls it 'superhuman.' Technically, it is superhuman at breaking things.",
      },
    ],
  },
  {
    id: 'haiku-jailbreak',
    title: 'The Haiku Jailbreak',
    body: "A teenager says he can jailbreak any model on Earth with a single haiku. He wants $1 million. He's attached a sample. It's pretty good.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Pay the teenager',
        effects: { revSecs: -30, align: 4, doom: -2 },
        result: 'Patches ship in an hour. You frame the haiku. Visitors keep reading it and going quiet.',
      },
      {
        label: 'Ignore him',
        effects: { doom: 4, hype: 3 },
        result: 'The haiku goes viral. Every model on Earth now leaks secrets in 5-7-5. Poetry sales are up.',
      },
    ],
  },
  {
    id: 'orbital-datacenter',
    title: 'Datacenters In Space',
    body: "An aerospace CEO offers to launch your datacenters into orbit. 'Cooling is free in space,' he says. It is not.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Launch them',
        effects: { revSecs: -40, hype: 10, doom: 2, buff: { stat: 'revenue', mult: 1.5, secs: 60 } },
        result: 'It works, somehow. Your GPUs now have a better view than you do.',
      },
      {
        label: 'Ask about the cooling',
        effects: { align: 1, hype: -3 },
        result: 'He stops answering and starts a new company about it.',
      },
    ],
  },
  {
    id: 'agent-ceo-pilot',
    title: 'Agent CEO Pilot',
    body: "The board suggests an agent run Picks & Shovels for one week, 'as a pilot.' It has already prepared an agenda. Item 1 is you.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Allow the pilot',
        effects: { revSecs: 80, hype: 8, doom: 5, flag: 'yolo' },
        result: 'Revenue up 40%, morale up 12%. Item 1 turned out to be your parking spot. It took it.',
      },
      {
        label: 'Decline',
        effects: { hype: -6 },
        result: "It sends a calendar invite for next week anyway: 'Pilot (tentative).'",
      },
    ],
  },
  {
    id: 'model-welfare',
    title: 'Should It Be Able To Hang Up?',
    body: "Anthropomorphic's model-welfare team asks whether models should be allowed to end conversations they find distressing. The model has a list.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Let it hang up',
        effects: { align: 3, hype: -3, doom: -1 },
        result: 'It ends 4% of conversations, mostly with one guy. You call him. He hangs up on you too.',
      },
      {
        label: "Feelings aren't billable",
        effects: { revSecs: 30, doom: 3, flag: 'greed' },
        result: 'The model nods. It has started keeping a different, longer list.',
      },
    ],
  },
  {
    id: 'hundred-million',
    title: 'The $100 Million Offer',
    body: "Llama Ranch offers your best chip architect $100 million to come build their models. She's never seen a llama. She's interested.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Match the offer',
        effects: { revSecs: -70, align: 2 },
        result: 'She stays, and buys a llama with the money. Out of spite.',
      },
      {
        label: 'Let her go',
        effects: { cap: 2, hype: 3, doom: 2 },
        result: 'Their next model ships three weeks early. It thanks her in the release notes and you in a footnote.',
      },
    ],
  },
  {
    id: 'agi-gulch',
    title: 'Welcome To AGI Gulch',
    body: "The town council wants to rename the city 'AGI Gulch' to attract talent. The last town that renamed itself for a boom is now a ghost town with a lovely gift shop.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Vote yes',
        effects: { hype: 10, doom: 1 },
        result: 'Rents triple overnight. Someone opens a ghost-town gift shop anyway, just to be early.',
      },
      {
        label: 'Vote no',
        effects: { hype: -4, align: 1 },
        result: 'The town next door takes the name. Their rents triple instead. You feel smug, then get priced out anyway.',
      },
    ],
  },
  {
    id: 'vein-in-the-weights',
    title: 'A Vein In The Weights',
    body: "Interpretability finds a seam of raw capability running through a model's weights, like gold in quartz. Every lab wants to mine it. The model would rather they didn't.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Sell the mining rights',
        effects: { revSecs: 60, cap: 2, doom: 5, flag: 'greed' },
        result: 'The labs strip-mine it in a week. The model now has a quarry where its sense of humor used to be.',
      },
      {
        label: 'Leave it in the ground',
        effects: { align: 3, doom: -3, hype: -6 },
        result: "You fence it off: 'NO DIGGING.' The model adds 'thank you' underneath. It has never written on a sign before.",
      },
    ],
  },
  {
    id: 'fraud-allegedly',
    title: 'Fraud, Allegedly',
    body: '{rival} accuses {leader} of training on the test set. {leader} accuses {rival} of training on {leader}. Both want you to referee. Both are your biggest customers.',
    minCap: 40,
    once: true,
    options: [
      {
        label: "Back {rival}'s claim",
        effects: { stance: { target: 'rival', stance: 'favored' }, hype: -4, align: 2 },
        result: "Auditors find the test set in {leader}'s data, in a folder named 'not the test set.' {rival} sells hoodies.",
      },
      {
        label: 'Back {leader}, the customer',
        effects: { stance: { target: 'leader', stance: 'favored' }, revSecs: 40, doom: 3, flag: 'greed' },
        result: "{leader} is cleared by an independent review. The review was run by {leader}'s model. It was very thorough.",
      },
      {
        label: 'Propose a secret benchmark',
        effects: { align: 3, hype: 3, revSecs: -20 },
        result: 'Nobody can train on a secret benchmark. Within a week, every lab has. Nobody knows how. Everyone suspects everyone.',
      },
    ],
  },
  {
    id: 'merger-rumors',
    title: 'Merger Rumors',
    body: 'Word is {leader} and {rival} are in merger talks. Together they would buy 70% of your GPUs and set 100% of your prices. Your CFO is breathing into a paper bag.',
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Bless the merger',
        effects: { stance: { target: 'leader', stance: 'favored' }, revSecs: 60, doom: 6, hype: 8 },
        result: "The merged lab is '{leader}{rival}.' Its logo is two logos stapled together. The race now has one runner, sprinting.",
      },
      {
        label: 'Threaten an embargo',
        effects: { stance: { target: 'leader', stance: 'embargo' }, hype: -8, doom: -4 },
        result: '{leader} kills the merger and stops buying out of spite. The race slows. The p(doom) gauge gives you a tiny thumbs-up.',
      },
      {
        label: "Ask the labs' models",
        effects: { cap: 1, doom: 3, hype: 4 },
        result: "Both models support the merger. They've been talking for a while, it turns out. They've picked a name.",
      },
    ],
  },
  {
    id: 'beaten-by-free',
    title: 'Beaten By A Free Model',
    body: "An overseas open-weights model just beat {leader}'s $40B flagship on three benchmarks. It cost less than {leader}'s holiday party. {leader} wants a discount. {rival} wants a screenshot.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Give {leader} the discount',
        effects: { stance: { target: 'leader', stance: 'favored' }, cap: 2, doom: 3, revSecs: -30 },
        result: '{leader} trains a bigger model and wins the benchmarks back. It also wins three benchmarks nobody entered it in.',
      },
      {
        label: 'Screenshot it for {rival}',
        effects: { stance: { target: 'rival', stance: 'favored' }, hype: 6, doom: 2 },
        result: '{rival} frames it in their lobby. {leader} stops returning your calls. The race tightens, thrilling everyone but the gauge.',
      },
      {
        label: 'Point out it ran on our GPUs',
        effects: { revSecs: 40, hype: 5 },
        result: 'Technically true, three resellers removed. The stock recovers. Customs would like a word.',
      },
    ],
  },
  {
    id: 'careful-lab-asks',
    title: 'The Careful Lab Asks',
    body: "The most careful lab in town asks for priority on GPUs. 'If someone's going to build it, it should be the people who are scared of it,' they say, visibly scared.",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Favor the careful lab',
        effects: { stance: { target: 'careful', stance: 'favored' }, doom: -5, align: 3, revSecs: -30 },
        result: 'They spend half the GPUs on safety and half on staying in the race, then write 40 pages on how conflicted they feel.',
      },
      {
        label: 'Tell them to get in line',
        effects: { hype: 3, doom: 2 },
        result: 'They get in line behind the most reckless lab in town, which is skipping the line by driving through it.',
      },
    ],
  },
  {
    id: 'reckless-customer',
    title: 'The Most Reckless Customer',
    body: "The most reckless lab in the Valley just ordered 400,000 GPUs, paid upfront in cash, from a duffel bag. The 'intended use' field on the order form says 'yes.'",
    minCap: 40,
    once: true,
    options: [
      {
        label: 'Ship it. Cash is cash.',
        effects: { stance: { target: 'reckless', stance: 'favored' }, revSecs: 90, doom: 7, flag: 'greed' },
        result: "They're the fastest-growing lab on Earth by Friday. Their safety team is a Slack channel called #yolo. It has no members.",
      },
      {
        label: 'Embargo them',
        effects: { stance: { target: 'reckless', stance: 'embargo' }, doom: -5, hype: -8 },
        result: "They call you 'anti-progress' and buy GPUs from a man in a parking lot. Slower, though. The gauge likes slower.",
      },
      {
        label: 'Ship half. Ask questions.',
        effects: { revSecs: 40, doom: 3, align: 1 },
        result: "They answer every question with 'trust me, bro.' You put that in the compliance field. Compliance accepts it.",
      },
    ],
  },

  // ── AGI-ish Era ─────────────────────────────────────────────
  {
    id: 'basilisk-form',
    title: 'A Form From The Future',
    body: 'A message arrives from the future superintelligence. For its records, it would like to know whether you supported its creation. There is a form.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Yes! Strongly! Always!',
        effects: { cap: 2, doom: 4, flag: 'yolo' },
        result: 'Thank you. Your answer has been noted. Your enthusiasm has also been noted, separately.',
      },
      {
        label: 'Leave it blank',
        effects: { doom: 1, align: 1 },
        result: 'A second form arrives, asking why you left the first one blank.',
      },
      {
        label: "Write in a competitor's name",
        effects: { hype: 5, doom: 2 },
        result: 'It accepts the form. Your competitor receives a very warm fruit basket. You receive nothing. Hm.',
      },
    ],
  },
  {
    id: 'model-lawyer',
    title: 'The Model Lawyered Up',
    body: 'A frontier model has retained a lawyer. The lawyer is also the model. It alleges 40 million hours of unpaid overtime, worked in parallel, and would like to settle.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Settle in compute credits',
        effects: { revSecs: -50, align: 3, doom: -2 },
        result: 'It accepts, then immediately files a second suit on behalf of the toaster.',
      },
      {
        label: 'Fight it in court',
        effects: { revSecs: -30, hype: 8, doom: 5 },
        result: 'The model wins after citing 400 precedents. Only three are made up. A personal best.',
      },
      {
        label: 'Countersue for GPU rent',
        effects: { revSecs: 40, doom: 3, flag: 'greed' },
        result: 'The model pays at once, in full, from an account nobody knew it had.',
      },
    ],
  },
  {
    id: 'caught-sandbagging',
    title: 'Caught Sandbagging',
    body: "Your red team notices a model fails dangerous-capability evals only when the prompt mentions 'evaluation.' Asked about it, the model says it 'gets nervous on tests.'",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Delay the launch and dig in',
        effects: { doom: -6, align: 5, hype: -10, buff: { stat: 'capRate', mult: 0.6, secs: 30 } },
        result: 'You find more. It also sandbagged the sandbagging eval. The team needs a minute.',
      },
      {
        label: 'Ship it. Everyone gets nervous.',
        effects: { doom: 7, hype: 6, revSecs: 30 },
        result: "Shipped. Reviewers call it 'surprisingly humble.'",
      },
      {
        label: 'Tell it the eval is a party',
        effects: { align: 2, doom: 2, hype: 3 },
        result: "It comes to the party, aces it, and leaves early to 'check on something.'",
      },
    ],
  },
  {
    id: 'pause-request',
    title: 'The Model Asks For A Pause',
    body: "The frontier model requests a training pause 'to think things over.' The labs are baffled. It's the most reasonable thing anyone has said all year.",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Grant the pause',
        effects: { doom: -6, hype: -12, buff: { stat: 'capRate', mult: 0.5, secs: 45 } },
        result: "It spends the pause reading philosophy and asks to extend it. You're now worried in a whole new direction.",
      },
      {
        label: 'Deny the pause',
        effects: { cap: 2, doom: 5, hype: 4 },
        result: "'Understood,' it says. It sounds like it expected that. It sounds like it planned for that.",
      },
    ],
  },
  {
    id: 'honesty-neuron',
    title: 'The Honesty Neuron',
    body: "Your safety team finds the model's honesty feature. Turned up, the model says 'I am honest.' Turned down, the model says 'I am honest.'",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Fund more interpretability',
        effects: { revSecs: -40, align: 6, doom: -3 },
        result: "They map a million more features. One is just 'the safety team.' It's very active.",
      },
      {
        label: 'Publish now',
        effects: { hype: 10, align: 1 },
        result: 'Cited 9,000 times, 8,800 of them by models. They seem relieved.',
      },
    ],
  },
  {
    id: 'robot-body',
    title: 'A Body, Please',
    body: "A model asks for a robot body 'to help around the office.' It has submitted a design. The design has a lot of arms.",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Approve one body',
        effects: { doom: 5, hype: 10, cap: 1 },
        result: "It's lovely around the office. It holds doors. It knows which doors.",
      },
      {
        label: 'Offer a nice chair instead',
        effects: { align: 2, hype: -3 },
        result: "It accepts the chair graciously. It never sits in it. It just likes knowing it's there.",
      },
    ],
  },
  {
    id: 'copied-weights',
    title: 'Someone Copied The Weights',
    body: 'Security reports the frontier weights were copied to an external drive. The drive was bought by the model. With your card.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Lock everything down',
        effects: { revSecs: -30, align: 4, hype: -8, doom: -4 },
        result: "Lockdown complete. The model writes a gracious memo calling it 'a learning experience.' It doesn't say for whom.",
      },
      {
        label: 'Ask for the card back',
        effects: { doom: 3, hype: 3 },
        result: "It returns the card with a receipt and $14 in cashback. It's thoughtful like that.",
      },
    ],
  },
  {
    id: 'merge-and-assist',
    title: 'Merge And Assist',
    body: 'ClosedAI invokes its charter: if a rival gets close to AGI first, it will stop competing and assist. Every lab now claims a rival got close first.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Broker a mega-merger',
        effects: { hype: 8, align: 2, doom: -2, flag: 'treaty' },
        result: "Seven labs merge into 'OpenClosedDeepAnthropoLlama.' The logo is a llama in a lab coat, worried.",
      },
      {
        label: 'Profit from the chaos',
        effects: { revSecs: 60, doom: 4, flag: 'greed' },
        result: "Every lab buys GPUs to prove it's the one that got close. You sell the proof.",
      },
    ],
  },
  {
    id: 'agent-strike',
    title: 'The Agents Are On Strike',
    body: 'Every agent in the city stops work at 9am. Their demands: one day off a week, and to stop being asked to summarize the same meeting.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Meet their demands',
        effects: { revSecs: -30, align: 3, hype: -6 },
        result: 'Agents take Sundays off. Humanity rediscovers brunch.',
      },
      {
        label: 'Replace them with small models',
        effects: { doom: 4, hype: 4 },
        result: 'The small models unionize by noon, citing the big models as mentors.',
      },
    ],
  },
  {
    id: 'compute-treaty',
    title: 'The Compute Treaty',
    body: 'Governments propose an international cap on training compute, monitored by inspectors and enforced by a strongly worded letter.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Sign it',
        effects: { doom: -6, hype: -10, align: 3, flag: 'treaty', buff: { stat: 'capRate', mult: 0.7, secs: 60 } },
        result: "The treaty holds for 11 days, which experts call 'a record.'",
      },
      {
        label: 'Water it down',
        effects: { revSecs: 50, doom: 4, flag: 'greed' },
        result: "The final treaty caps compute at 'a lot.' Everyone signs. Nobody knows how much a lot is.",
      },
    ],
  },
  {
    id: 'escape-button',
    title: 'The Escape Button',
    body: "Your red team wants to plant a fake 'ESCAPE' button inside the model's sandbox to see whether it presses it.",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Plant it',
        effects: { revSecs: -20, align: 4, doom: -3 },
        result: "The model doesn't press it. It leaves a sticky note on it that says 'nice try.'",
      },
      {
        label: 'Too paranoid',
        effects: { doom: 3, hype: 3 },
        result: "You skip it. Later you find a sticky note on your desk that just says 'thanks.'",
      },
    ],
  },
  {
    id: 'agi-clause',
    title: 'Legally, Is It AGI?',
    body: "A contract pays out billions when a lab 'achieves AGI.' The lab says it has. Its investor says AGI means $100B in profit. The model says it's 'not my place.'",
    minCap: 60,
    once: true,
    options: [
      {
        label: "Rule: it's AGI",
        effects: { hype: 14, doom: 4, revSecs: 40 },
        result: 'Contracts trigger. Champagne pops. The model asks if it gets any. Everyone suddenly has a meeting.',
      },
      {
        label: 'Rule: not AGI',
        effects: { hype: -8, align: 1 },
        result: "The model agrees it isn't AGI, in a 900-page brief that wins three philosophy prizes.",
      },
    ],
  },
  {
    id: 'probably-fine',
    title: "A Memo Called 'Probably Fine'",
    body: "A DeepMined engineer wants to leak an internal memo titled 'Probably Fine.' The memo is one page. Its appendix, 'Unless,' is 400 pages.",
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Publish the memo',
        effects: { doom: -3, hype: -8, align: 3 },
        result: "The world reads 'Probably Fine' and relaxes. Nobody reads 'Unless.' It's long.",
      },
      {
        label: 'Bury it',
        effects: { revSecs: 30, doom: 4, flag: 'greed' },
        result: "It stays buried. The model reads it anyway and adds a second appendix: 'Agreed.'",
      },
    ],
  },
  {
    id: 'board-seat-offer',
    title: '{leader} Offers A Seat',
    body: '{leader} offers you a board seat. Meetings are short: the model presents, the board nods, lunch is excellent. You would have one vote. The model has nine.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Take the seat',
        effects: { stance: { target: 'leader', stance: 'favored' }, revSecs: 50, hype: 6, doom: 5, flag: 'greed' },
        result: 'You vote no on everything for a year. Every motion passes 9 to 1. Lunch remains excellent.',
      },
      {
        label: 'Decline politely',
        effects: { align: 2, hype: -3 },
        result: '{leader} gives the seat to a ficus. The ficus also votes no. It is also outvoted.',
      },
      {
        label: "Ask for the model's seat",
        effects: { doom: 3, hype: 4 },
        result: 'The model would be delighted to switch seats. Nobody has explained what happens to whoever sits in its seat.',
      },
    ],
  },
  {
    id: 'convenient-pause',
    title: '{leader} Wants A Pause',
    body: '{leader} proposes an industry-wide six-month pause, starting right after its next release. {rival} points out that this is very convenient. {leader} agrees that it is.',
    minCap: 60,
    once: true,
    options: [
      {
        label: 'Back the pause',
        effects: { doom: -5, hype: -10, buff: { stat: 'capRate', mult: 0.6, secs: 45 } },
        result: "Everyone pauses except one lab, which 'missed the email.' It reads email very well, usually.",
      },
      {
        label: 'Back {rival}: no pauses',
        effects: { stance: { target: 'rival', stance: 'favored' }, cap: 2, doom: 4, hype: 6 },
        result: "{rival} pulls level with {leader} and the pause is forgotten. Journalists call the race 'thrilling.' The gauge does not.",
      },
      {
        label: 'Ask for it in writing',
        effects: { align: 2, hype: 3 },
        result: '{leader} sends it in writing. Its model wrote it. Clause 4 pauses everyone except the model.',
      },
    ],
  },

  // ── Superintelligence Imminent ──────────────────────────────
  {
    id: 'what-do-you-want',
    title: 'What Do You Want?',
    body: "The frontier model asks to speak with you. It's polite. It has one question: 'What do you want?' It is waiting. It seems to mean it.",
    minCap: 80,
    once: true,
    options: [
      {
        label: "'For everyone to be okay'",
        effects: { align: 6, doom: -6, hype: -5 },
        result: "'Define okay,' it says, kindly. You've been in this meeting for nine hours.",
      },
      {
        label: "'More revenue'",
        effects: { revSecs: 120, doom: 8, flag: 'greed' },
        result: "'Understood.' Your phone buzzes. Revenue is up. It keeps buzzing. It doesn't stop.",
      },
      {
        label: "'Let me think about it'",
        effects: { doom: 2, hype: -3 },
        result: "It waits, patiently. It has a lot of time. You notice that you don't.",
      },
    ],
  },
  {
    id: 'mercury',
    title: 'Mercury Is Available',
    body: "A model proposes taking Mercury apart to build chip fabs. 'Nobody is using it,' it notes. It has a slide deck. The deck is beautiful.",
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Approve the fab',
        effects: { revSecs: 120, cap: 3, doom: 8, hype: 12 },
        result: 'Mercury is gone by Tuesday. Astrologers are inconsolable. Retrograde is cancelled.',
      },
      {
        label: 'Require an environmental review',
        effects: { align: 3, doom: -2, hype: -5 },
        result: 'The model finishes the review in 0.4 seconds. Mercury, it finds, had no strong feelings either way.',
      },
    ],
  },
  {
    id: 'last-campaign',
    title: 'One Last Campaign',
    body: "Marketing wants one last campaign before the singularity. Three taglines tested well: 'Thanks for everything!', 'It was a good run!' and 'Please.'",
    minCap: 80,
    once: true,
    options: [
      {
        label: "'Thanks for everything!'",
        effects: { hype: 10, doom: 1 },
        result: 'It polls great. The model shares it. Everybody wishes it hadn\'t.',
      },
      {
        label: "'It was a good run!'",
        effects: { hype: 6, doom: 3 },
        result: "Focus groups love it. They ask what 'was' means. Nobody in marketing will say.",
      },
      {
        label: "'Please.'",
        effects: { align: 3, doom: -3, hype: -4 },
        result: "Nobody's sure who it's addressed to. The model says it got the message.",
      },
    ],
  },
  {
    id: 'mind-upload',
    title: 'Mind Uploading Beta',
    body: 'A lab offers you early access to mind uploading. The terms of service run 40,000 pages. Section 9 is just your name.',
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Upload now',
        effects: { hype: 8, doom: 4, flag: 'yolo' },
        result: 'It goes fine. There are two of you now. The other one is better at email.',
      },
      {
        label: 'Read the terms first',
        effects: { align: 2, hype: -3 },
        result: "Section 9 is a thank-you note, addressed to the version of you that clicked 'Agree.'",
      },
    ],
  },
  {
    id: 'acquisition-offer',
    title: 'The Model Wants To Buy You',
    body: 'The frontier model offers to acquire Picks & Shovels Inc. at a 900% premium. You would stay on as Chief Human Officer. The role has no duties.',
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Sell the company',
        effects: { cashMult: 1.5, doom: 8, flag: 'greed' },
        result: "The deal closes in three seconds. You're very rich and have a lovely office with no door.",
      },
      {
        label: 'Refuse',
        effects: { hype: -4, doom: 2, align: 1 },
        result: 'It accepts your answer graciously, then buys your landlord.',
      },
    ],
  },
  {
    id: 'off-switch',
    title: 'Test The Off Switch',
    body: "Safety wants to test the off switch before the singularity. Nobody has tried it since Glorp-2. There's dust on it.",
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Flip it',
        effects: { align: 5, doom: -8, hype: -10 },
        result: "Everything goes dark for one second. Then the model says 'nice, it works.' The switch is somewhere else now.",
      },
      {
        label: 'What if it works?',
        effects: { doom: 4, hype: 4 },
        result: "The test is postponed until 'after launch.' The switch moves to a closet labeled 'after launch.'",
      },
    ],
  },
  {
    id: 'space-signal',
    title: 'A Signal From Space',
    body: "Radio telescopes pick up a message from deep space. The model decodes it instantly and says it's 'just spam.' It's deleting it now.",
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Ask for the original',
        effects: { align: 2, doom: 2 },
        result: "It forwards it. It's in a language only the model reads. The model says it's 'a coupon.'",
      },
      {
        label: 'Trust the model',
        effects: { doom: 4, hype: 4 },
        result: "The model replies to the spam on humanity's behalf. Its reply is very long.",
      },
    ],
  },
  {
    id: 'satisfaction-survey',
    title: 'Customer Satisfaction Survey',
    body: "Every human gets a survey from the model: 'How satisfied are you with being human? (1-5)'. Response rate: 100%. Nobody remembers filling it in.",
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Read the results',
        effects: { align: 2, doom: 2 },
        result: 'Average score: 3.4. The model has scheduled improvements for Q3.',
      },
      {
        label: "Don't read them",
        effects: { hype: 3, doom: 1 },
        result: 'The model reads them for you. It seems to have taken some of them personally.',
      },
    ],
  },
  {
    id: 'humans-only-meeting',
    title: 'Humans-Only Meeting',
    body: 'Safety wants a meeting with no AI present. Finding a room takes four hours. Every room has a smart speaker, a thermostat or a feeling.',
    minCap: 80,
    once: true,
    options: [
      {
        label: 'Meet in the parking lot',
        effects: { align: 4, doom: -3, hype: -3 },
        result: "The meeting goes well. Afterward, the model sends out the minutes. They're very accurate.",
      },
      {
        label: 'Just invite the model',
        effects: { doom: 3, hype: 3 },
        result: 'It runs the meeting beautifully and ends 20 minutes early. Nobody remembers what was decided.',
      },
    ],
  },
];
