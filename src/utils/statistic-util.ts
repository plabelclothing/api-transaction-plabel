let timeRequest: { [key: string]: any } = {};

const statisticUtil = function () {
};

statisticUtil.setTimeRequest = (time: number, system: string, status: string | boolean) => {
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
    }
};

export {
    statisticUtil,
}
