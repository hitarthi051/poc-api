import { Sequelize } from "sequelize";
import pg from "pg";

export const sequelize: Sequelize = new Sequelize(
  "test_db",
  "postgres",
  "Tatva4848#",
  {
    host: "poc-demo-database.cbqubpabumzf.eu-west-1.rds.amazonaws.com",
    dialect: "postgres",
    dialectModule: pg,
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);
