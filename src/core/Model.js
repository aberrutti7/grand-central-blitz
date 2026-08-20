import "phaser"
import ApiService from "../services/ApiService";

export default class Model extends Phaser.Events.EventEmitter {

    constructor(scene, config, api) {
        super();
        this.scene = scene
        this.config = config        
        /**
         * @type {ApiService}
         */
        this.apiService = api
        this.init();
    }

    init() {
        this.lastResult = null;

        this.baseGamePlays = this.scene.game.cache.json.get('baseGamePlays');
        this.bonusGamePlays = this.scene.game.cache.json.get('freeSpinsGamePlays');

        this.baseGamePlaysSB = this.scene.game.cache.json.get('baseGamePlaysSB');
        this.bonusGamePlaysSB = this.scene.game.cache.json.get('freeSpinsGamePlaysSB');
    
        this.bonusBuyGamePlays = this.scene.game.cache.json.get('bonusBuyGamePlays');
        this.singlePlay = this.scene.game.cache.json.get('singlePlay');

        this.spinPlays = {
            singleplay: {
                label: 'Single Play',
                fileName: 'single_play',
                normal: this.singlePlay,
                visibleInForcedPlay: true,
            },
        };
    }

    getWaysWinningAnimation(){
        return this.config.waysWinningAnimation
    }

    getLinesWinningAnimation(){
        return this.config.linesWinningAnimation
    }

    getSpinOptions() {
        return this.config.forcedPlays
    }

    getBalance(){
        return this.config.balance
    }

    getAvailableBets(){
        const baseBet = this.config.bet;

        const stakes = this.config.availableBets.map(value => ({
            value,
            multiplier: value / baseBet
        }));

        return stakes
    }

    getBonusBuyElements(){
        return this.config.bonusBuy
    }

    getGapBetweenReels(){
        return this.config.reelsConfig.gapBetweenReels ?? 0
    }
    
    getGapBetweenRows(){
        return this.config.reelsConfig.gapBetweenRows ?? 0
    }

    getBigWins(){
        return this.config.bigWins
    }

    //game properties
    getInfo() {
        return this.config.info;
    }

    getDebugMode() {
        return this.config.debug;
    }

    getGameName(){
        return this.config.gameName;
    }

    getVersion(){
        return this.config.version;
    }
    
    getBet(){
        return this.config.bet;
    }

    getSideBet(){
        const sidebets = this.getSideBets();
        return sidebets.length > 0 ? sidebets[0].multiplier : 0;
    }

    getSideBets(){
        const raw = this.config.sidebets;
        if (Array.isArray(raw) && raw.length > 0) {
            if (typeof raw[0] === 'object') return raw;
            return raw.map((m, i) => ({ id: `sidebet_${i}`, name: `${m}x`, multiplier: m }));
        }
        if (this.config.sidebet) {
            return [{ id: 'default', name: `${this.config.sidebet}x`, multiplier: this.config.sidebet }];
        }
        return [];
    }
    
    getBonusBuy(){
        return this.config.bonusBuy;
    }

    getReels() {
        return this.config.reels;
    }
    
    getReelsY(){
        return this.config.reelsY;
    }

    getTrackerReels(){
        return this.config.trackerReels;
    }

    getTrackerScaleY(){
        return this.config.trackerScaleY;
    }

    getReelById(id) {
        return this.config.reels["r" + id];
    }

    getReelsConfig(){
        return this.config.reelsConfig;
    }

    getGrid(){
        return this.config.grid;
    }

    getSymbolSize() {
        return this.config.symbolSize;
    }

    getSlotType() {
        return this.config.slotType;
    }

    getRandomSpin(jsonFile){
        this.playNumber = Math.round(Math.random() * (jsonFile.spins.length - 1));
        let result = JSON.parse(JSON.stringify(jsonFile.spins[this.playNumber]));
        return result;
    }

    async getSpin({ type = 'basegame', sidebet = null, bonusBuy = null }) {
        if (type.includes('file-')) {
            const { fileName, normal } = this.spinPlays.singleplay;

            this.configFileName = fileName;
            this.lastResult = this.getRandomSpin(normal);

            console.log(`${fileName}.json: ${this.playNumber}`);

            return this.spinNextStep();
        }

        if (type === 'missing-forced') return null;

        const spinType = bonusBuy ? 'basegame' : type;
        let gameMode;
        if (bonusBuy) {
            gameMode = bonusBuy;
        } else if (sidebet) {
            gameMode = `SB_${sidebet.id}`;
        } else {
            gameMode = 'Regular';
        }

        try {
            this.lastResult = await this.apiService.getSpin(spinType, gameMode);

            console.log(this.lastResult);

            return this.spinNextStep();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getPlayMeta(){
        return {file: this.configFileName, playNumber: this.playNumber}
    }

    spinNextStep() {
        if (this.lastResult == null || this.lastResult.length == 0) {
            return false;
        }

        let result = this.lastResult.shift();
        
        if (result.freespins != null) {
            result = { type: 'freespin', data: result.freespins };
        } else if (result.cascades != null) {
            result = { type: 'cascade', data: result.cascades };
        } else if (result.respin != null) {
            result = { type: 'respin', data: result.respin };
        }else {
            result = { type: 'basespin', data: result.basespin };
        }

        console.log(result);
        return result
    }
}
