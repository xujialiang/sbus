var  SBUSUART = require('./sbus');

// new SBUSUART().listDevice((ports)=>{
//     ports.forEach((port)=>{
//         console.log(port);
//     });
// },(err)=>{
//     console.log(err);
// })
var sbus = new SBUSUART();
sbus.setupConvertParams(200, 2000);
sbus.start('/dev/tty.usbserial-00003314B', (status, channels, channels_c)=>{
    console.debug('Decode Data:', status, channels,channels_c);
});