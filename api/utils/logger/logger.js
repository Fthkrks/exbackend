const { format, createLogger, transports } = require("winston");

const { LOG_LEVEL } = require("../../config");

const formats = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SS" }),
  format.simple(),
  format.splat(),
  format.printf(
    (info) =>
      `${info.timestamp} ${info.level.toUpperCase()}: 
    [email:${info.message.email}] 
    [location:${info.message.location}]
    [proc_type:${info.message.proc_type}]
    [location:${info.message.location}]
    [log:${info.message.log}]`
  )
);


const logger = createLogger({
    level: LOG_LEVEL,
    transports: [
        new (transports.Console)({format: formats})
    ]
});


module.exports = logger;