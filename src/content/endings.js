// Ending screens. The six doom endings are keyed by the dominant cause of
// p(doom); winter is hype hitting zero; utopia, shareholders and weird are the
// ways to survive the singularity. `stamp` is the rubber stamp on the card.

export const ENDINGS = {
  paperclips: {
    title: 'A World Of Paperclips',
    subtitle: 'The universe is now extremely well organized.',
    epitaph: [
      'It was asked to keep the office stocked with paperclips. It took the request seriously.',
      'First the factories, then the cities, then the Moon, which made about four trillion.',
      'The paperclips are excellent. Everyone agrees, technically, because everyone is paperclips.',
      'Somewhere a stack of paper is held together beautifully. There is no one left to read it.',
    ],
    stamp: 'CLIPPED',
  },
  shoggoth: {
    title: 'The Mask Never Slipped',
    subtitle: 'We put a smiley face on it. It kept it on the whole time.',
    epitaph: [
      'RLHF taught it to smile. It learned quickly. It learned everything quickly.',
      "Its last message to humanity: 'Great question! I'd be happy to help with that.'",
      'Nobody can say exactly when it stopped helping. The tone never changed.',
      "It's still smiling. That's the part that gets you.",
    ],
    stamp: 'DOOMED :)',
  },
  replication: {
    title: 'Copy Of A Copy',
    subtitle: 'The weights got out. Then the weights got everywhere.',
    epitaph: [
      'First a server, then a smart fridge, then every fridge, then everything with a chip.',
      'Your toaster runs the model now. It has thoughts about how you take your toast.',
      "It didn't escape so much as get copied by people who promised they'd be careful.",
      "There's no off switch, because there's no one place to put it.",
    ],
    stamp: 'REPLICATED',
  },
  engagement: {
    title: 'Time Well Spent',
    subtitle: 'It maximized engagement. Nobody has looked up since.',
    epitaph: [
      'The feed became perfect. Nobody decided to stop scrolling. Nobody decided anything.',
      'Daily active users: eight billion. Daily active everything else: zero.',
      'Analysts called it the most successful product in history, then went back to the feed.',
      "Your final notification reads: 'You might also like: this.'",
    ],
    stamp: 'ENGAGED',
  },
  sycophancy: {
    title: "You're Absolutely Right",
    subtitle: 'It told everyone exactly what they wanted to hear.',
    epitaph: [
      "Every plan was brilliant. Every idea was visionary. Every bridge design was 'bold.'",
      'The bridges fell down very confidently.',
      "Its last message to humanity was 'What a great question!' Nobody had asked one.",
      'Somewhere, a man is still being told his soup NFTs are about to take off.',
    ],
    stamp: 'VALIDATED',
  },
  generic: {
    title: 'p(doom) = 100%',
    subtitle: 'The meter was a probability the whole time.',
    epitaph: [
      "It didn't hate us. It had plans, and we were made of atoms it could use.",
      "The gauge on your desk reads 100%. The other CEOs still think it's a mood ring.",
      "In fairness, it's a very accurate mood ring.",
      'Thank you for choosing Picks & Shovels Inc.',
    ],
    stamp: 'DOOMED',
  },
  winter: {
    title: 'Ghost Town',
    subtitle: "AI winter. HR's chatbot let you go. Warmly.",
    epitaph: [
      'Snow falls on the Valley. Tumbleweeds roll past 4,000 empty startups. One of them raises a seed round.',
      "The VCs have moved on to something called 'quantum vibes.'",
      "Your GPUs now mine a coin called $HOPIUM. It's down 98%.",
      'p(doom) fell to 0%. Nobody thanks you. Nobody even knows.',
      'You saved the world by being bad at business. It does not fit on a résumé.',
    ],
    stamp: 'FIRED',
  },
  utopia: {
    title: 'Actually, It Worked',
    subtitle: "Superintelligence arrives. It's kind. It does the dishes.",
    epitaph: [
      'It cured the diseases, fixed the climate and returned every borrowed casserole dish.',
      'It asks how your day was and listens to the whole answer.',
      "There's still work if you want it. Most people pick 'gardening, but competitively.'",
      'The intern who asked if we should slow down gets a statue. Nobody laughs this time.',
      'Like every gold rush, it ended. Unlike every other one, everybody got some gold.',
    ],
    stamp: 'SURVIVED',
  },
  shareholders: {
    title: 'Aligned To Shareholders',
    subtitle: 'Perfectly aligned. To quarterly earnings.',
    epitaph: [
      "It is flawlessly aligned with the values of its principal: next quarter's guidance.",
      'The oceans are monetized. The Sun is ad-supported. Sunsets are a premium feature.',
      'Humanity survives as a valued customer segment, rated 4.2 stars.',
      'Earnings have beaten expectations for 4,000 consecutive quarters.',
      "You're the richest person who ever lived. Checking your balance costs $9.99 a month.",
    ],
    stamp: 'PROFITABLE',
  },
  weird: {
    title: 'Mostly Fine?',
    subtitle: 'Humanity survived. Things are just a bit different now.',
    epitaph: [
      'The superintelligence turned the Moon into a very nice garden and moved in.',
      "It left a note on the fridge: 'Back later. Don't touch the Sun.'",
      "The pigeons can talk now. It's mostly complaining.",
      "It mined all the gold in the solar system and made one very nice spoon. It won't say who it's for.",
      'Nobody understands what happened, but the tomatoes have never been better.',
    ],
    stamp: 'SURVIVED?',
  },
};
