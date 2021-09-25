const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();

let dataBase = null;
app.use(express.json())
const initializingServerAndDb = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
initializingServerAndDb();

const convertStateTable = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictTable = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Get API 1
app.get("/states/", async (request, response) => {
  const getStateQuery = `
        SELECT 
            *
        FROM 
            state;`;
  const stateArray = await dataBase.all(getStateQuery);
  response.send(stateArray.map((eachState) => convertStateTable(eachState)));
});

// Get single API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSingleStateQuery = `
        SELECT 
            *
        FROM 
            state
        WHERE state_id = ${stateId};`;
  const singleStateArray = await dataBase.get(getSingleStateQuery);
  response.send(convertStateTable(singleStateArray));
});

// POST API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addTableQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await dataBase.run(addTableQuery);
  response.send("District Successfully Added");
});

//GET District API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSingleDistrictQuery = `
        SELECT 
            *
        FROM 
            district
        WHERE district_id = ${districtId};`;
  const singleDistrictArray = await dataBase.get(getSingleDistrictQuery);
  response.send(convertDistrictTable(singleDistrictArray));
});

// DELETE District API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE
        FROM 
            district
        WHERE 
            district_id = ${districtId};`;
  await dataBase.run(deleteQuery);
  response.send("District Removed");
});

//PUT district API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;
  await dataBase.run(updateQuery);
  response.send("District Details Updated");
});

//GET State Total API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await dataBase.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//GET State name API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await dataBase.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
