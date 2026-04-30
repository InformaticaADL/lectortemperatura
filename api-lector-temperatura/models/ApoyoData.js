const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApoyoData = sequelize.define('ApoyoData', {
    id_registro: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    equipo_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora: {
      type: DataTypes.TIME(0),
      allowNull: false
    },
    temperatura: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    serial_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: DataTypes.DATE(0),
    updatedAt: DataTypes.DATE(0)
  }, {
    tableName: 'apoyo_historico',
    timestamps: true
  });

  return ApoyoData;
};
