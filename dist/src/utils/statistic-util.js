"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let timeRequest = {};
const statisticUtil = function () {
};
exports.statisticUtil = statisticUtil;
statisticUtil.setTimeRequest = (time, system, status) => {
    timeRequest[system] = {};
    timeRequest[system].time = time;
    if (status) {
        timeRequest[system].status = status;
    }
};
statisticUtil.getTimeRequest = () => {
    return timeRequest;
};
statisticUtil.createStatistics = () => {
    return {
        responseTime: statisticUtil.getTimeRequest(),
    };
};
