let _reportInfo = {};
let captchaToken = null;

dew.on('show', function (e) {
    playerIndex = e.data.playerIndex;
    playerName = e.data.playerName;


    
    Promise.all([
        dew.callMethod("playerReportInfo", {
            playerIndex: playerIndex
        }), 
        dew.getSessionInfo(),
        dew.getStats(playerName),
        dew.command('Player.EncryptGmtTimestamp'),
        dew.command('Player.PubKey'),
        dew.getMapVariantInfo(),
        dew.getGameVariantInfo()
    ])
        .then(([reportInfo, sessionInfo, stats, encryptedTimestamp, publicKey, mapVariantInfo, gameVariantInfo]) => {
            console.log('done');
            _reportInfo = Object.assign({}, JSON.parse(reportInfo), {
                map: mapVariantInfo.name,
                mapFile: sessionInfo.mapFile,
                mapFile: sessionInfo.mapName,
                variant: gameVariantInfo.name,
                offenderStats: stats,
                encryptedTimestamp: encryptedTimestamp,
                publicKey: publicKey
            });
        });
});

window.recaptchaCallback = function recaptchaCallback(response) {
    captchaToken = response;
}


function submitReport(endpoint, payload) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {  
                if (xhr.status === 200) {  
                    resolve();
                } else {  
                  reject();
                }
            }
        };
        xhr.onerror = () => reject();
        xhr.send(payload);
    });
}

document.getElementById('reportSubmit').addEventListener('click', function() {
    if(!captchaToken) {
        console.error('captcha not complete');
        return;
    }
    let reportDetails = {
        'gRecaptchaResponse': captchaToken,
        reason: document.getElementById('reportReason').value,
        detail: document.getElementById('reportDetail').value,
        contact: {
            method: document.getElementById('reportContactType').value,
            info: document.getElementById('reportContactInfo').value
        },    
    };

    let payload = Object.assign({}, reportDetails, _reportInfo);
    submitReport('http://halostats.click/api/submitreport', payload).then(function() {
        console.log('report submitted!');
    });
});