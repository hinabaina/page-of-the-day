/* Банк вопросов дня для дневника атмосферы и распознавание цветов в ответах */
(function (PV) {
  'use strict';

  // 40 вопросов дня по 10 категориям (по 4 в каждой)
  PV.PROMPTS = [
    // color (цвет)
    {
      id: 'color',
      q: 'Если бы у сегодняшнего дня был цвет, какой?',
      en: 'If today had a color, what would it be?',
      kind: 'color',
      ph: 'например, персиковый',
      ph_en: 'e.g. peach'
    },
    {
      id: 'color-duo',
      q: 'В каких двух цветах можно представить сегодняшнее настроение?',
      en: 'What two colors best describe today\'s mood?',
      kind: 'color',
      ph: 'например, лавандовый и золотистый',
      ph_en: 'e.g. lavender and gold'
    },
    {
      id: 'color-thing',
      q: 'Цвет какой вещи лучше всего подошёл бы сегодняшнему дню?',
      en: 'The color of what object would suit today best?',
      kind: 'color',
      ph: 'например, цвет уютного шерстяного свитера',
      ph_en: 'e.g. the color of a cozy wool sweater'
    },
    {
      id: 'color-sky',
      q: 'Какой оттенок неба сегодня запомнился больше всего?',
      en: 'What shade of the sky stood out to you the most today?',
      kind: 'color',
      ph: 'например, нежно-розовый на закате',
      ph_en: 'e.g. soft pink at sunset'
    },

    // song (музыка и песня)
    {
      id: 'song-day',
      q: 'Какая песня лучше всего описывает твой день?',
      en: 'What song describes your day?',
      kind: 'song',
      ph: 'например, спокойный инди-трек',
      ph_en: 'e.g. a calm indie track'
    },
    {
      id: 'song-soundtrack',
      q: 'Если бы этот день был фильмом, какой саундтрек играл бы на фоне?',
      en: 'If today were a movie, what soundtrack would be playing in the background?',
      kind: 'song',
      ph: 'например, тёплая акустическая гитара',
      ph_en: 'e.g. warm acoustic guitar'
    },
    {
      id: 'song-line',
      q: 'Какая строчка из музыки крутилась в мыслях сегодня?',
      en: 'What line from a song was running through your mind today?',
      kind: 'song',
      ph: 'например, пара слов из любимого припева',
      ph_en: 'e.g. a few words from a favorite chorus'
    },
    {
      id: 'song-rhythm',
      q: 'В каком музыкальном ритме прошёл этот день?',
      en: 'What musical rhythm did your day move to?',
      kind: 'song',
      ph: 'например, неторопливый джаз или бодрый поп-бит',
      ph_en: 'e.g. mellow jazz or a lively pop beat'
    },

    // moment (момент)
    {
      id: 'today-special',
      q: 'Что сделало сегодняшний день особенным?',
      en: 'What made today special?',
      kind: 'moment',
      ph: 'например, долгая прогулка без спешки',
      ph_en: 'e.g. a long walk without rushing'
    },
    {
      id: 'remember-moment',
      q: 'Какой момент хочется сохранить в памяти?',
      en: 'What moment would you like to remember?',
      kind: 'moment',
      ph: 'например, тишину и свет из окна перед закатом',
      ph_en: 'e.g. the quiet and the light from the window before sunset'
    },
    {
      id: 'moment-pause',
      q: 'В какую секунду дня захотелось нажать на паузу?',
      en: 'At what moment today did you want to hit pause?',
      kind: 'moment',
      ph: 'например, когда чай оказался идеально горячим',
      ph_en: 'e.g. when the tea was perfectly hot'
    },
    {
      id: 'moment-turning-point',
      q: 'Какое маленькое событие неожиданно изменило ход дня?',
      en: 'What small event unexpectedly changed the course of your day?',
      kind: 'moment',
      ph: 'например, внезапный лучик солнца сквозь тучи',
      ph_en: 'e.g. a sudden ray of sun through the clouds'
    },

    // smile (улыбка и смех)
    {
      id: 'smile-little',
      q: 'Какая мелочь заставила улыбнуться сегодня?',
      en: 'What is one little thing that made you smile today?',
      kind: 'smile',
      ph: 'например, забавный кот в окне напротив',
      ph_en: 'e.g. a funny cat in the window across the street'
    },
    {
      id: 'smile-laugh',
      q: 'Что сегодня вызвало самый искренний смех?',
      en: 'What brought you the most genuine laugh today?',
      kind: 'smile',
      ph: 'например, нелепая шутка или смешной мем',
      ph_en: 'e.g. a silly joke or a funny meme'
    },
    {
      id: 'smile-message',
      q: 'Какое тёплое сообщение или новость порадовали за день?',
      en: 'What warm message or good news brightened your day?',
      kind: 'smile',
      ph: 'например, короткое приветствие от друга',
      ph_en: 'e.g. a quick hello from a friend'
    },
    {
      id: 'smile-detail',
      q: 'Какая милая деталь привлекла внимание на улице?',
      en: 'What lovely detail caught your eye outside?',
      kind: 'smile',
      ph: 'например, необычный стикер на фонарном столбе',
      ph_en: 'e.g. an unusual sticker on a lamppost'
    },

    // place (место и пространство)
    {
      id: 'place-cozy',
      q: 'Где сегодня было уютнее всего находиться?',
      en: 'Where did you feel the coziest today?',
      kind: 'place',
      ph: 'например, в мягком кресле с пледом',
      ph_en: 'e.g. in a soft armchair with a blanket'
    },
    {
      id: 'place-corner',
      q: 'Какой уголок города или комнаты подарил чувство покоя?',
      en: 'What corner of the city or room brought you a sense of calm?',
      kind: 'place',
      ph: 'например, тихий столик в углу кофейни',
      ph_en: 'e.g. a quiet corner table at a coffee shop'
    },
    {
      id: 'place-route',
      q: 'Какое место на сегодняшнем маршруте выглядело особенно красиво?',
      en: 'What place along your route today looked especially beautiful?',
      kind: 'place',
      ph: 'например, освещённая вечерними огнями улица',
      ph_en: 'e.g. a street glowing with evening lights'
    },
    {
      id: 'place-teleport',
      q: 'В какое место на планете хотелось бы мысленно переместиться прямо сейчас?',
      en: 'Where in the world would you love to teleport to right now?',
      kind: 'place',
      ph: 'например, на берег моря в сумерках',
      ph_en: 'e.g. by the seashore at dusk'
    },

    // people (люди и общение)
    {
      id: 'people-warmth',
      q: 'Кто сегодня подарил самое тёплое ощущение?',
      en: 'Who gave you the warmest feeling today?',
      kind: 'people',
      ph: 'например, незнакомец с доброй улыбкой',
      ph_en: 'e.g. a stranger with a kind smile'
    },
    {
      id: 'people-words',
      q: 'Какие добрые слова прозвучали в твой адрес сегодня?',
      en: 'What kind words did you hear today?',
      kind: 'people',
      ph: 'например, простое и искреннее «спасибо»',
      ph_en: 'e.g. a simple and sincere "thank you"'
    },
    {
      id: 'people-silence',
      q: 'С кем сегодня было приятно разделить тишину или разговор?',
      en: 'Who was it lovely to share silence or a conversation with today?',
      kind: 'people',
      ph: 'например, с близким человеком за вечерним чаем',
      ph_en: 'e.g. with someone close over evening tea'
    },
    {
      id: 'people-glance',
      q: 'Чей взгляд или жест подняли настроение?',
      en: 'Whose look or gesture lifted your spirits?',
      kind: 'people',
      ph: 'например, дружелюбный кивок соседа',
      ph_en: 'e.g. a friendly nod from a neighbor'
    },

    // taste (вкус и угощения)
    {
      id: 'taste-flavor',
      q: 'Какой вкус ярче всего запомнился сегодня?',
      en: 'What flavor was the most memorable today?',
      kind: 'taste',
      ph: 'например, пряный чай с мятой и лимоном',
      ph_en: 'e.g. spiced tea with mint and lemon'
    },
    {
      id: 'taste-comfort',
      q: 'Какая еда или напиток принесли настоящее удовольствие?',
      en: 'What food or drink brought you genuine pleasure today?',
      kind: 'taste',
      ph: 'например, свежая хрустящая булочка с корицей',
      ph_en: 'e.g. a fresh, warm cinnamon roll'
    },
    {
      id: 'taste-season',
      q: 'Если бы день был десертом, каким бы он был?',
      en: 'If today were a dessert, what would it be?',
      kind: 'taste',
      ph: 'например, шоколадным фонданом с ягодами',
      ph_en: 'e.g. chocolate fondant with berries'
    },
    {
      id: 'taste-craving',
      q: 'Какой вкус сейчас идеально дополнил бы вечер?',
      en: 'What taste would be the perfect addition to this evening?',
      kind: 'taste',
      ph: 'например, кружка какао с маршмеллоу',
      ph_en: 'e.g. a mug of cocoa with marshmallows'
    },

    // weather (погода и природа)
    {
      id: 'weather-mood',
      q: 'Как погода за окном повлияла на настроение сегодня?',
      en: 'How did the weather outside affect your mood today?',
      kind: 'weather',
      ph: 'например, лёгкий дождь помог сосредоточиться',
      ph_en: 'e.g. gentle rain helped you focus'
    },
    {
      id: 'weather-air',
      q: 'Чем пах воздух во время сегодняшней прогулки?',
      en: 'What did the air smell like on your walk today?',
      kind: 'weather',
      ph: 'например, свежестью, ветром и мокрым асфальтом',
      ph_en: 'e.g. freshness, wind, and wet pavement'
    },
    {
      id: 'weather-light',
      q: 'Каким был дневной свет сегодня?',
      en: 'What was the daylight like today?',
      kind: 'weather',
      ph: 'например, мягким, рассеянным и приглушённым',
      ph_en: 'e.g. soft, diffused, and muted'
    },
    {
      id: 'weather-element',
      q: 'Какое природное явление сегодня ощущалось ярче всего?',
      en: 'What element of nature did you feel most vividly today?',
      kind: 'weather',
      ph: 'например, прохладный вечерний ветерок',
      ph_en: 'e.g. a cool evening breeze'
    },

    // gratitude (благодарность)
    {
      id: 'gratitude-self',
      q: 'За что хочется искренне поблагодарить себя сегодня?',
      en: 'What would you like to genuinely thank yourself for today?',
      kind: 'gratitude',
      ph: 'например, за терпение и умение вовремя сделать перерыв',
      ph_en: 'e.g. for patience and knowing when to take a break'
    },
    {
      id: 'gratitude-simple',
      q: 'За какую простую радость сегодняшнего дня хочется сказать спасибо?',
      en: 'What simple joy from today are you grateful for?',
      kind: 'gratitude',
      ph: 'например, за возможность никуда не спешить утром',
      ph_en: 'e.g. having time not to rush in the morning'
    },
    {
      id: 'gratitude-help',
      q: 'Какая неожиданная помощь или забота оказались кстати?',
      en: 'What unexpected help or kindness came at just the right time?',
      kind: 'gratitude',
      ph: 'например, вовремя предложенная чашка горячего чая',
      ph_en: 'e.g. a cup of hot tea offered right on time'
    },
    {
      id: 'gratitude-lesson',
      q: 'Какое приятное открытие о себе или о мире подарил этот день?',
      en: 'What pleasant discovery about yourself or the world did today bring?',
      kind: 'gratitude',
      ph: 'например, что даже в трудные моменты можно найти спокойствие',
      ph_en: 'e.g. that you can find peace even in difficult moments'
    },

    // feeling (чувства и ощущения)
    {
      id: 'feeling-word',
      q: 'Каким одним словом можно описать общее ощущение от дня?',
      en: 'What single word describes the overall feeling of your day?',
      kind: 'feeling',
      ph: 'например, ясность, тишина или предвкушение',
      ph_en: 'e.g. clarity, stillness, or anticipation'
    },
    {
      id: 'feeling-body',
      q: 'Где в теле сегодня жило главное чувство дня?',
      en: 'Where in your body did you feel today\'s main emotion?',
      kind: 'feeling',
      ph: 'например, тепло в груди и расслабленные плечи',
      ph_en: 'e.g. warmth in the chest and relaxed shoulders'
    },
    {
      id: 'feeling-transition',
      q: 'Как изменилось внутреннее состояние за день?',
      en: 'How did your inner state change throughout the day?',
      kind: 'feeling',
      ph: 'например, от утренней сонливости к вечернему вдохновению',
      ph_en: 'e.g. from morning sleepiness to evening inspiration'
    },
    {
      id: 'feeling-takeaway',
      q: 'Какое ощущение хочется забрать с собой в завтрашний день?',
      en: 'What feeling would you like to carry into tomorrow?',
      kind: 'feeling',
      ph: 'например, чувство уверенности и душевного спокойствия',
      ph_en: 'e.g. a sense of confidence and peace of mind'
    }
  ];

  // Простое хеширование строки (детерминированное)
  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  // Выбор вопроса дня: детерминированно для даты и недавних id
  PV.pickPrompt = function (dateISO, recentIds) {
    if (!dateISO || typeof dateISO !== 'string') return null;

    const h = hashString(dateISO);
    // Пропускаем примерно 1 день из 3 (h % 3 === 0)
    if (h % 3 === 0) return null;

    const recents = Array.isArray(recentIds) ? recentIds : [];
    const recentSet = new Set(recents);

    let candidates = PV.PROMPTS.filter(p => !recentSet.has(p.id));
    if (!candidates.length) return null;

    if (recents.length > 0) {
      const lastId = recents[0];
      const lastPrompt = PV.PROMPTS.find(p => p.id === lastId);
      if (lastPrompt) {
        const diffKind = candidates.filter(p => p.kind !== lastPrompt.kind);
        if (diffKind.length > 0) {
          candidates = diffKind;
        }
      }
    }

    // Дополнительное перемешивание для равномерного выбора индекса
    let x = h;
    x = ((x >>> 16) ^ x) * 0x45d9f3b;
    x = ((x >>> 16) ^ x) * 0x45d9f3b;
    x = (x >>> 16) ^ x;

    const idx = Math.abs(x) % candidates.length;
    return candidates[idx];
  };

  // Соответствие основ названий цветов в русском и английском языках и hex-кодов
  PV.COLOR_WORDS = {
    // Русский язык
    'красн': '#e05a53',
    'розов': '#f38ba8',
    'персик': '#ffb38a',
    'голуб': '#74c0fc',
    'син': '#4a72d4',
    'зелён': '#51cf66',
    'зелен': '#51cf66',
    'жёлт': '#fcc419',
    'желт': '#fcc419',
    'оранж': '#ff922b',
    'фиолет': '#845ef7',
    'сирен': '#b197fc',
    'серен': '#b197fc',
    'лаванд': '#cc99f8',
    'бирюз': '#20c997',
    'мятн': '#63e6be',
    'бежев': '#d8c2a7',
    'коричн': '#8d5b4c',
    'сер': '#868e96',
    'чёрн': '#212529',
    'черн': '#212529',
    'бел': '#f8f9fa',
    'золот': '#f59f00',
    'мандарин': '#ff8717',
    'лимон': '#ffe066',
    'коралл': '#ff6b6b',
    'бордо': '#722f37',
    'пудр': '#e8b4b8',
    'небесн': '#99d4fc',
    'изумруд': '#2f9e44',
    'шоколад': '#5c3a21',

    // English
    'red': '#e05a53',
    'pink': '#f38ba8',
    'peach': '#ffb38a',
    'sky': '#74c0fc',
    'blue': '#4a72d4',
    'green': '#51cf66',
    'yellow': '#fcc419',
    'orange': '#ff922b',
    'purple': '#845ef7',
    'violet': '#845ef7',
    'lilac': '#b197fc',
    'lavender': '#cc99f8',
    'turquoise': '#20c997',
    'mint': '#63e6be',
    'beige': '#d8c2a7',
    'brown': '#8d5b4c',
    'gray': '#868e96',
    'grey': '#868e96',
    'black': '#212529',
    'white': '#f8f9fa',
    'gold': '#f59f00',
    'lemon': '#ffe066',
    'coral': '#ff6b6b',
    'burgundy': '#722f37',
    'navy': '#1d3557',
    'emerald': '#2f9e44',
    'chocolate': '#5c3a21',
    'cream': '#fff3bf',
    'rose': '#f38ba8'
  };

  // Поиск первого подходящего цвета (более длинные основы проверяются первыми)
  PV.colorFromWords = function (text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase();
    const stems = Object.keys(PV.COLOR_WORDS).sort((a, b) => b.length - a.length);
    for (let i = 0; i < stems.length; i++) {
      const stem = stems[i];
      // английские слова — только целиком (иначе «red» находится в «ordered»), русские основы — с окончаниями
      const hit = /^[a-z]+$/.test(stem) ? new RegExp('\\b' + stem + '\\b').test(lower) : lower.includes(stem);
      if (hit) {
        return PV.COLOR_WORDS[stem];
      }
    }
    return null;
  };
})(window.PV = window.PV || {});
