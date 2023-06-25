import winston from 'winston';

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.json(),
        winston.format.printf(info => {
            const time = new Date(info.timestamp);
            const date = `${time.getDate()}-${time.getMonth() + 1}-${time.getFullYear()} - ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
            let msg;
            const rest = (({ level, timestamp, message, ...restOfObject }) => {
                msg = `${date} ${level}: ${typeof message === "string" ? message : JSON.stringify(message,null,2)}`;
                return restOfObject;
            })(info)
            return Object.keys(rest).length ? `${msg}, ${JSON.stringify(rest, null, 2)}` : msg;
        })
      ),
    transports: [new winston.transports.Console({})],
});

export default logger;