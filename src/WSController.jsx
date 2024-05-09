const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:5000'

let send
export function openConnection(path, callback) {
    const ws = new window.WebSocket(`ws://${host}${path}`)
    console.log(ws)
    console.log("hmmm")
    
    ws.onopen = () => {
        console.log('open connection')
        ws.send("test")
    }

    ws.onerror = (e) => {
        console.log(e)
    }

    ws.onclose = (e) => {
        console.log('close connection: ', e)
    }

    ws.onmessage = (e) => {
        console.log(e.data)
        callback(JSON.parse(e.data))
    }

    send = ws.send.bind(ws)

}