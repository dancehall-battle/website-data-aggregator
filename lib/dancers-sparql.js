const {format} = require('date-fns');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {createNameForBattle, setPostfix} = require('./utils');
const fs = require('fs-extra');
const path = require('path');
const QueryEngine = require('@comunica/query-sparql').QueryEngine;
const N3 = require('n3');
const jsonld = require('jsonld');

module.exports = async (rankings, options = {printPerObject: false}) => {
  let dancers = (await queryData())['@graph'];
  const context = await fs.readJson(path.join(__dirname, 'context.json'));
  const originalContext = JSON.parse(JSON.stringify(context['@context']));

  dancers = recursiveJSONKeyTransform(key => {
    if (key === '@id' || key === '@type') {
      key = key.substring(1);
    }

    return key;
  })(dancers)

  if (options.printPerObject) {

    console.log('[');
    while (dancers.length > 0) {
      const dancer = dancers.shift();

      _updateDancer(dancer, rankings, originalContext);

      console.log(JSON.stringify(dancer));

      if (dancers.length > 0) {
        console.log(',');
      }
    }
    console.log(']');
  } else {
    dancers.forEach(dancer => {
      _updateDancer(dancer, rankings);
    });

    return dancers;
  }

  return dancers;
};

function getRankForDancer(rankingMap, id) {
  const positions = Object.keys(rankingMap);
  let j = 0;
  let rank = null;

  while (j < positions.length && !rank) {
    const position = positions[j];
    const items = rankingMap[position];

    let i = 0;

    while (i < items.length && items[i].dancer.id !== id) {
      i++;
    }

    if (i < items.length) {
      rank = items[i];
    }

    j++;
  }

  if (rank) {
    return {
      points: rank.points,
      position: rank.position
    };
  } else {
    return null;
  }
}

function _updateDancer(dancer, rankings, originalContext) {
  dancer.originalQueryResults = {
    '@context': originalContext,
    '@graph': JSON.parse(JSON.stringify(dancer))
  };

  setPostfix(dancer);
  dancer.ranks = {
    dancerCombined: null,
    dancer2vs2: null,
    dancer1vs1: null
  }

  if (rankings.dancerCombined) {
    dancer.ranks.dancerCombined = getRankForDancer(rankings.dancerCombined.map, dancer.id);
  }

  if (rankings.dancer2vs2) {
    dancer.ranks.dancer2vs2 = getRankForDancer(rankings.dancer2vs2.map, dancer.id);
  }

  if (rankings.dancer1vs1) {
    dancer.ranks.dancer1vs1 = getRankForDancer(rankings.dancer1vs1.map, dancer.id);
  }

  if (dancer.wins) {
    if (!Array.isArray(dancer.wins)) {
      dancer.wins = [dancer.wins];
    }

    formatAndSortBattles(dancer.wins);
  }

  if (dancer.judges) {
    if (!Array.isArray(dancer.judges)) {
      dancer.judges = [dancer.judges];
    }

    formatAndSortBattles(dancer.judges);
  }
}

function formatAndSortBattles(battles) {
  battles.forEach(battle => {
    battle.start = battle.start['@value'];
    battle.end = battle.end['@value'];
    battle.participants = battle.participants['@value'];
    battle.date = format(new Date(battle.start), 'MMM d, yyyy', {awareOfUnicodeTokens: true});
    battle.name = createNameForBattle(battle);
    delete battle.atEvent.hasBattle; // This can probably also be done when we frame the data.
  });

  battles.sort((a, b) => {
    const aDate = new Date(a.start);
    const bDate = new Date(b.start);

    if (aDate < bDate) {
      return 1;
    } else if (aDate > bDate) {
      return -1;
    } else {
      return 0;
    }
  });
}

function queryData() {
  return new Promise(async resolve => {
    const myEngine = new QueryEngine();

    const sparqlQueryDancers = `
    PREFIX schema: <http://schema.org/>
    PREFIX dhb: <https://dancehallbattle.org/ontology/>
    
    CONSTRUCT WHERE {
     ?dancer a ?dancerTypes;
            schema:name ?name;
            dhb:representsCountry ?country;
            dhb:instagram ?instagram.
    }
  `;

    const sparqlQueryBattleWins = `
    PREFIX schema: <http://schema.org/>
    PREFIX dhb: <https://dancehallbattle.org/ontology/>
    
    CONSTRUCT WHERE {
      ?battle a ?battleTypes;
        dhb:hasWinner ?dancer;
        schema:name ?name;
        dhb:level ?level;
        dhb:gender ?gender;
        dhb:age ?age;
        schema:startDate ?start;  
        schema:endDate ?end; 
        dhb:amountOfParticipants ?participants; 
        dhb:inviteOnly ?inviteOnly.
        
      ?event a ?eventTypes; 
        dhb:hasBattle ?battle;
        schema:name ?eventName;
        schema:location ?location.
    }
  `;

    const sparqlQueryBattleJudged = `
    PREFIX schema: <http://schema.org/>
    PREFIX dhb: <https://dancehallbattle.org/ontology/>
    
    CONSTRUCT WHERE {
      ?battle a ?battleTypes;
        dhb:hasJudge ?dancer;
        schema:name ?name;
        dhb:level ?level;
        dhb:gender ?gender;
        dhb:age ?age;
        schema:startDate ?start;  
        schema:endDate ?end; 
        dhb:amountOfParticipants ?participants; 
        dhb:inviteOnly ?inviteOnly.
        
      ?event a ?eventTypes; 
        dhb:hasBattle ?battle;
        schema:name ?eventName;
        schema:location ?location.
    }
  `;

    const writer = new N3.Writer({format: 'N-Quads'});

    const quadStream = await myEngine.queryQuads(sparqlQueryDancers, {
      sources: ['http://localhost:8080/data'],
    });

    for await (const quad of quadStream) {
      writer.addQuad(quad);
    }

    const quadStream2 = await myEngine.queryQuads(sparqlQueryBattleWins, {
      sources: ['http://localhost:8080/data'],
    });

    for await (const quad of quadStream2) {
      writer.addQuad(quad);
      // if (quad.predicate.value === 'https://dancehallbattle.org/ontology/hasWinner') {
      //   console.log(quad.subject.value, quad.predicate.value, quad.object.value);
      // }
    }

    const quadStream3 = await myEngine.queryQuads(sparqlQueryBattleJudged, {
      sources: ['http://localhost:8080/data'],
    });

    for await (const quad of quadStream3) {
      writer.addQuad(quad);
      // if (quad.predicate.value === 'https://dancehallbattle.org/ontology/hasJudge') {
      //   console.log(quad.subject.value, quad.predicate.value, quad.object.value);
      // }
    }

    writer.end(async (error, result) => {
      const doc = await jsonld.fromRDF(result, {format: 'application/n-quads'});
      const frame = await fs.readJson(path.join(__dirname, 'context.json'));
      frame['@type'] = "dhb:Dancer";
      frame['wins'] = {
        atEvent: {}
      };
      frame['judges'] = {
        atEvent: {}
      };
      const framed = await jsonld.frame(doc, frame);
      resolve(framed);
    });
  });
}
