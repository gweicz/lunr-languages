var loadModule = require('hunspell-asm').loadModule;
var fs = require('fs');

var path = require('path');
var base = path.dirname(require.resolve('dictionary-cs'));

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, async function () {  
    
  var hunspellFactory = await loadModule()
  
  const getFile = function (fileName) {
    const file = fs.readFileSync(path.join(base, fileName));
    const buffer = new Uint8Array(file);
    return hunspellFactory.mountBuffer(buffer, fileName);  
  }
  
  const affFile = getFile('index.aff');  
  const dictFile = getFile('index.dic');   

  var hunspell = hunspellFactory.create(affFile, dictFile);

  console.log('hunspell loaded');

  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function (lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.cs = function () {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.cs.trimmer,
        lunr.cs.stopWordFilter,
        lunr.cs.stemmer
      );

      // for lunr version 2
      // this is necessary so that every searched word is also stemmed before
      // in lunr <= 1 this is not needed, as it is done using the normal pipeline
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.cs.stemmer)
      }
    };

    /* lunr trimmer function */
    lunr.cs.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
    lunr.cs.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.cs.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.cs.trimmer, 'trimmer-cs');

    /* lunr stemmer function */
    lunr.cs.stemmer = (function () {
      /* create the wrapped stemmer object */
      var
        SnowballProgram = lunr.stemmerSupport.SnowballProgram,
        sbp = new SnowballProgram(),
        st = new function HungarianStemmer() {
          this.setCurrent = function (word) {
            sbp.setCurrent(word);
          };

          this.getCurrent = function () {
            return sbp.getCurrent();
          };

          this.stem = function () {
            const word = sbp.getCurrent();

            const stemmedWords = hunspell.stem(word);

            let resultWord = word;

            if (stemmedWords.length > 0) {
              resultWord = stemmedWords[0];
              console.log(word, stemmedWords.join(' '))
            }
            else {
              console.log("NOT STEMMED", word)
            }

            sbp.setCurrent(resultWord);

            return true
          };
        };

      /* and return a function that stems a word for the current locale */
      return function (token) {
        // for lunr version 2
        if (typeof token.update === "function") {
          return token.update(function (word) {
            st.setCurrent(word);
            st.stem();
            return st.getCurrent();
          })
        } else { // for lunr version <= 1
          st.setCurrent(token);
          st.stem();
          return st.getCurrent();
        }
      }
    })();

    lunr.Pipeline.registerFunction(lunr.cs.stemmer, 'stemmer-cs');

    lunr.cs.stopWordFilter = lunr.generateStopWordFilter('a aby ahoj aj ale anebo ani aniž ano asi aspoň atd atp az ačkoli až bez beze blízko bohužel brzo bude budem budeme budes budete budeš budou budu by byl byla byli bylo byly bys byt být během chce chceme chcete chceš chci chtít chtějí chuť chuti ci clanek clanku clanky co coz což cz daleko dalsi další den deset design devatenáct devět dnes do dobrý docela dva dvacet dvanáct dvě dál dále děkovat děkujeme děkuji email ho hodně i jak jakmile jako jakož jde je jeden jedenáct jedna jedno jednou jedou jeho jehož jej jeji jejich její jelikož jemu jen jenom jenž jeste jestli jestliže ještě jež ji jich jimi jinak jine jiné jiz již jsem jses jseš jsi jsme jsou jste já jí jím jíž jšte k kam každý kde kdo kdy kdyz když ke kolik kromě ktera ktere kteri kterou ktery která které který kteři kteří ku kvůli ma mají mate me mezi mi mit mne mnou mně moc mohl mohou moje moji možná muj musí muze my má málo mám máme máte máš mé mí mít mě můj může na nad nade nam napiste napište naproti nas nasi načež naše naši ne nebo nebyl nebyla nebyli nebyly nechť nedělají nedělá nedělám neděláme neděláte neděláš neg nejsi nejsou nemají nemáme nemáte neměl neni není nestačí nevadí nez než nic nich nimi nove novy nové nový nula ná nám námi nás náš ní ním ně něco nějak někde někdo němu němuž o od ode on ona oni ono ony osm osmnáct pak patnáct po pod podle pokud potom pouze pozdě pořád prave pravé pred pres pri pro proc prostě prosím proti proto protoze protože proč prvni první práve pta pět před přede přes přese při přičemž re rovně s se sedm sedmnáct si sice skoro smí smějí snad spolu sta sto strana sté sve svych svym svymi své svých svým svými svůj ta tady tak take takhle taky takze také takže tam tamhle tamhleto tamto tato te tebe tebou teď tedy tema ten tento teto ti tim timto tipy tisíc tisíce to tobě tohle toho tohoto tom tomto tomu tomuto toto trošku tu tuto tvoje tvá tvé tvůj ty tyto téma této tím tímto tě těm těma těmu třeba tři třináct u určitě uz už v vam vas vase vaše vaši ve vedle večer vice vlastně vsak vy vám vámi vás váš více však všechen všechno všichni vůbec vždy z za zatímco zač zda zde ze zpet zpravy zprávy zpět čau či článek článku články čtrnáct čtyři šest šestnáct že'.split(' '));

    lunr.Pipeline.registerFunction(lunr.cs.stopWordFilter, 'stopWordFilter-cs');
  };
}))

