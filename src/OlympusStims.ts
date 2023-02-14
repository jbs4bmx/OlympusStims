/**
 *      Name: OlympusStims
 *   Version: 350.0.1
 * Copyright: AssAssIn
 *    Update: [DMY] 13.02.2023
*/

import { DependencyContainer } from "tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/externals/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ImporterUtil } from "@spt-aki/utils/ImporterUtil";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";

let zeusdb;

class Olympus implements IPreAkiLoadMod, IPostDBLoadMod
{
    private pkg;
    private path = require('path');
    private modName = this.path.basename(this.path.dirname(__dirname.split('/').pop()));

    public postDBLoad(container: DependencyContainer)
    {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const db = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const preAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
        const databaseImporter = container.resolve<ImporterUtil>("ImporterUtil");
        const locales = db.locales.global;
        this.pkg = require("../package.json");
        zeusdb = databaseImporter.loadRecursive(`${preAkiModLoader.getModPath(this.modName)}database/`);

        for (const i_item in zeusdb.templates.items) {
            db.templates.items[i_item] = zeusdb.templates.items[i_item];
        }

        for (const h_item of zeusdb.templates.handbook.Items) {
            if (!db.templates.handbook.Items.find(i=>i.Id == h_item.Id)) {
                db.templates.handbook.Items.push(h_item);
            }

        }

        for (const localeID in locales) {
            for (const locale in zeusdb.locales.en) {
                locales[localeID][locale] = zeusdb.locales.en[locale];
            }
        }

        for (const p_item in zeusdb.templates.prices) {
            db.templates.prices[p_item] = zeusdb.templates.prices[p_item];
        }

        for (const tradeName in db.traders) {
            if ( tradeName === "54cb57776803fa99248b456e" ) {
                for (const ti_item of zeusdb.traders.Therapist.items.list) {
                    if (!db.traders[tradeName].assort.items.find(i=>i._id == ti_item._id)) {
                        db.traders[tradeName].assort.items.push(ti_item);
                    }
                }
                for (const tb_item in zeusdb.traders.Therapist.barter_scheme) {
                    db.traders[tradeName].assort.barter_scheme[tb_item] = zeusdb.traders.Therapist.barter_scheme[tb_item];
                }
                for (const tl_item in zeusdb.traders.Therapist.loyal_level_items){
                    db.traders[tradeName].assort.loyal_level_items[tl_item] = zeusdb.traders.Therapist.loyal_level_items[tl_item];
                }
            }
        }

        this.pushBuffs(container);
        this.checkExclusions(container);

        logger.info(`${this.pkg.author}-${this.pkg.name} v${this.pkg.version}: Cached successfully`);
        logger.log("Zeus grants you access to enhanced meds for your quests.", "yellow");
        logger.log("Hestia's selflessness provides you the courage and power to smite your enemies.", "magenta");
        logger.log("Hera, Poseidon, Demeter, Athena, Apollo, Artemis, Ares, Hephaestus, Aphrodite, ", "cyan");
        logger.log("Hermes, and Dionysus rally you on as you storm into battle.", "cyan");
    }

    public pushBuffs(container: DependencyContainer): void {
        const gameGlobals = container.resolve<DatabaseServer>("DatabaseServer").getTables().globals.config;
        const gameBuffs = gameGlobals.Health.Effects.Stimulator.Buffs;
        const additions = zeusdb.globals.buffs;
        for (const stimBuff in additions) {
            gameBuffs[stimBuff] = additions[stimBuff];
        }
    }

    public checkExclusions(container: DependencyContainer): void {
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
        const { blacklistMeds } = require("./config.json");

        if (typeof blacklistMeds === "boolean"){
            if (blacklistMeds === true) {
                botConfig.pmc.dynamicLoot.blacklist.push("apollosStim","apollosPropital","apollosPain","apollosCMS");
            }
        }
    }

}
module.exports = { mod: new Olympus() }