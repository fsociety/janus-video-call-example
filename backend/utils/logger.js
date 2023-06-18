import winston from 'winston';

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.json(),
        winston.format.printf(info => {
            let message = `${info.timestamp} ${info.level}: `;
            delete info.timestamp;
            delete info.level;
            message += JSON.stringify(info, null, 4);
            return message;
        })
      ),
    transports: [new winston.transports.Console({})],
});

export default logger;