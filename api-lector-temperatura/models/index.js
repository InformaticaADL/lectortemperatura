const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../db/SequelizeConfig");

const db = {};

// Cargar modelos
// Cargar modelos
db.Empresa = require('./Empresa')(sequelize, DataTypes);
db.Centro = require('./Centro')(sequelize, DataTypes);
db.Sede = require('./Sede')(sequelize, DataTypes);
db.Termografo = require('./Termografo')(sequelize, DataTypes);
db.Usuario = require('./Usuario')(sequelize, DataTypes);
db.ZonaGeografica = require('./ZonaGeografica')(sequelize, DataTypes);
db.IncubadoraData = require('./IncubadoraData')(sequelize, DataTypes);
db.ApoyoData = require('./ApoyoData')(sequelize, DataTypes);

// Ejecutar asociaciones
Object.values(db).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
