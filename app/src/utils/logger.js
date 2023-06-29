const logger = {
    info(...args){
        args.forEach(arg => {
            typeof arg === "string" ? 
            console.log(`%c ${arg}`, 'background: #transparent; color: #45bab1; font-style: italic') : 
            console.log(arg);
        })
    },
    error(...args){
        args.forEach(arg => {
            typeof arg === "string" ? 
            console.error(`%c ${arg}`, 'background: transparent; color: #FFD2D2') :
            console.error(arg);
        })
    }
}

export default logger;