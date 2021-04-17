var  SBUSUART = require('./sbus');

// new SBUSUART().listDevice((ports)=>{
//     ports.forEach((port)=>{
//         console.log(port);
//     });
// },(err)=>{
//     console.log(err);
// })

try {
    var sbus = new SBUSUART();
    // sbus.setupConvertParams(200, 1800);
    sbus.start('/dev/tty.usbserial-00003314B', (status, channels, channels_c)=>{
        console.log('Decode Data:', new Date(), status, channels,channels_c);
    });
} catch (error) {
    console.log('error', error);
}
