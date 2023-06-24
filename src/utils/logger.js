const logger = {
    info(...args){
        args.forEach(arg => {
            console.log(typeof arg === "object" ? arg : `%c ${arg}`, 'background: #transparent; color: #45bab1; font-style: italic')
        })
    },
    error(...args){
        args.forEach(arg => {
            console.error(typeof arg === "object" ? arg : `%c ${arg}`, 'background: transparent; color: #FFD2D2')
        })
    }
}

export default logger;