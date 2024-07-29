// nameGenerator.js

let verbs = [];
let verbings = [];
let adjs = [];
let artifacts = [];
let characters = [];
let containers = [];
let metals = [];
let monsters = [];
let occupations = [];
let passages = [];
let prepositions = [];
let settings = [];
let seasons = [];
let animals = [];
let nouns = [];
let traceryGrammar;

function preloadCorporaFiles() {
  verbs = loadJSON('./assets/corpora/verbs.json', (data) => {
    verbs = data.verbs.map(verb => verb.present);
    console.log("Verbs loaded:", verbs);
  });
  verbings = loadJSON('./assets/corpora/ing-verbs.json', (data) => {
    verbings = data.verbings.map(verbings => verbings.present);
    console.log("Verbings loaded:", verbings);
  });
  adjs = loadJSON('./assets/corpora/adjs.json', (data) => {
    adjs = data.adjs;
    console.log("Adjectives loaded:", adjs);
  });
  artifacts = loadJSON('./assets/corpora/artifact.json', (data) => {
    artifacts = data.artifacts.map(artifact => artifact.name);
    console.log("Artifacts loaded:", artifacts);
  });
  characters = loadJSON('./assets/corpora/character.json', (data) => {
    characters = data.characters.map(character => character.name);
    console.log("Characters loaded:", characters);
  });
  containers = loadJSON('./assets/corpora/containers.json', (data) => {
    containers = data.containers;
    console.log("Containers loaded:", containers);
  });
  metals = loadJSON('./assets/corpora/metals.json', (data) => {
    metals = data.metals;
    console.log("Metals loaded:", metals);
  });
  monsters = loadJSON('./assets/corpora/monsters.json', (data) => {
    monsters = data.names;
    console.log("Monsters loaded:", monsters);
  });
  occupations = loadJSON('./assets/corpora/obsolete-occupations.json', (data) => {
    occupations = data.occupations;
    console.log("Occupations loaded:", occupations);
  });
  passages = loadJSON('./assets/corpora/passages.json', (data) => {
    passages = data.passages;
    console.log("Passages loaded:", passages);
  });
  prepositions = loadJSON('./assets/corpora/prepositions.json', (data) => {
    prepositions = data.prepositions;
    console.log("Prepositions loaded:", prepositions);
  });
  settings = loadJSON('./assets/corpora/setting.json', (data) => {
    settings = data.settings.map(setting => setting.name);
    console.log("Settings loaded:", settings);
  });
  seasons = loadJSON('./assets/corpora/seasons.json', (data) => {
    seasons = data.seasons;
    console.log("Seasons loaded:", seasons);
  });
  animals = loadJSON('./assets/corpora/animals-common.json', (data) => {
    animals = data.animals;
    console.log("Animals loaded:", animals);
  });
  nouns = loadJSON('./assets/corpora/nouns.json', (data) => {
    nouns = data.nouns;
    console.log("Nouns loaded:", nouns);
  });
}

function setupTraceryGrammar() {
  console.log("Setting up Tracery grammar...");

  try {
    console.log("Verbs:", verbs);
    console.log("ing-verbs:", verbings);
    console.log("Adjectives:", adjs);
    console.log("Artifacts:", artifacts);
    console.log("Characters:", characters);
    console.log("Containers:", containers);
    console.log("Metals:", metals);
    console.log("Monsters:", monsters);
    console.log("Occupations:", occupations);
    console.log("Passages:", passages);
    console.log("Prepositions:", prepositions);
    console.log("Settings:", settings);
    console.log("Seasons:", seasons);
    console.log("Animals:", animals);
    console.log("Nouns:", nouns);

    traceryGrammar = tracery.createGrammar({
      "figure": [
        "The #adj# #artifact#",
        "#character# and the #container#",
        "#monster# of #metal#",
        "The #character#'s #setting#",
        "The #monster# #preposition# the #setting#",
        "The #metal# #setting#",
        "The #adj# #setting#",
        "#setting# in #season#",
        "The #artifact# in #season#",
        "#artifact# of the #adj# #setting#",
        "The #character#",
        "The #animal#",
        "The #season# #animal#",
        "The #animal# and the #character#",
        "The #animal# and the #monster#",
        "The #monster# and the #occupation#",
        "The #adj# #character#",
        "The #occupation#",
        "The #verbing# #animal#",
        "#setting# #preposition# and #setting# #preposition#",
        "#adj.a# #season#",
        "#noun#",
        "#noun# #preposition# the #setting#",
        "The #adj# #setting# #preposition# #adj.a# #setting#",
        "#noun# #verbing# #preposition# the #setting#",
        "The #character# #verbing# #preposition# #adj.a# #setting#",
        "#preposition# the #metal# #setting#",
        "The #character#'s #noun#",
        "#character# of the #metal# age",
      ],
      "verb": verbs,
      "verbing": verbings,
      "adj": adjs,
      "artifact": artifacts,
      "character": characters,
      "container": containers,
      "metal": metals,
      "monster": monsters,
      "occupation": occupations,
      "passage": passages,
      "preposition": prepositions,
      "setting": settings,
      "season": seasons,
      "animal": animals,
      "noun": nouns,
    });

    console.log("Tracery grammar set up:", traceryGrammar);
  } catch (error) {
    console.error("Error setting up Tracery grammar:", error);
  }
}

function generateFigureName() {
  console.log("Generating figure name...");
  try {
    const name = traceryGrammar.flatten("#figure#");
    console.log("Generated figure name:", name);
    return name;
  } catch (error) {
    console.error("Error generating figure name:", error);
    return "Unknown Figure";
  }
}

function generateFantasyWord(length) {
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const vowels = "aeiou";
  let word = "";
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      word += consonants.charAt(Math.floor(Math.random() * consonants.length));
    } else {
      word += vowels.charAt(Math.floor(Math.random() * vowels.length));
    }
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}
