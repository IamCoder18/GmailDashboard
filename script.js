let emailList = []

const progressBar = document.getElementById("progress")
const statusTxt = document.querySelector("#status")
const fromTxt = document.querySelector("#fromTxt")

const gapiLoadPromise = new Promise((resolve, reject) => {
    gapiLoadOkay = resolve;
    gapiLoadFail = reject;
});
const gisLoadPromise = new Promise((resolve, reject) => {
    gisLoadOkay = resolve;
    gisLoadFail = reject;
});

var tokenClient;

(async () => {
    document.getElementById("getMailsBtn").style.visibility = "none";
    await gapiLoadPromise;
    await new Promise((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
    });
    await gapi.client.init({})
        .then(function () {
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest');
        });

    await gisLoadPromise;
    await new Promise((resolve, reject) => {
        try {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: '886253033190-n0o2c88nfb1r92rab3b0datf0o09d818.apps.googleusercontent.com',
                scope: 'https://mail.google.com',
                prompt: 'consent',
                callback: ''
            });
            resolve();
        } catch (err) {
            if (progressBar.classList.contains("bg-warning")) progressBar.classList.replace("bg-warning", "bg-danger")
            if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-danger")
            statusTxt.innerText = `An error occurred. Error is as follows: ${err}`
            console.error(err)
        }
    });

    document.getElementById("getMailsBtn").style.visibility = "visible";
    document.getElementById("revokeBtn").style.visibility = "visible";
})();
async function getToken() {
    await new Promise((resolve, reject) => {
        try {
            tokenClient.callback = (resp) => {
                if (resp.error !== undefined) {
                    reject(resp);
                }
                document.getElementById("revokeBtn").classList.remove('d-none')
                resolve(resp);
            };
            tokenClient.requestAccessToken();
        } catch (err) {
            if (progressBar.classList.contains("bg-warning")) progressBar.classList.replace("bg-warning", "bg-danger")
            if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-danger")
            if (statusTxt.classList.contains("text-bg-warning")) statusTxt.classList.replace("text-bg-warning", "text-bg-danger")
            if (statusTxt.classList.contains("text-bg-info")) statusTxt.classList.replace("text-bg-info", "text-bg-danger")
            statusTxt.innerText = `An error occurred. Error is as follows: ${err}`
            console.error(err)
        }
    });
}

async function getMails(cat = 0, nextPageToken = null) {
    if (!fromTxt.value) {
        let labelWhich = [document.querySelector("#switchP").checked, document.querySelector("#switchU").checked, document.querySelector("#switchS").checked, document.querySelector("#switchT").checked, document.querySelector("#switchM").checked]
        let tCount = 0
        labelWhich.forEach(e => { if (e) tCount += 1 });
        labelIds = ['CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_SOCIAL', 'TRASH', 'SPAM']
        if (labelWhich[cat]) {
            if (gapi.client.getToken()) {
                progressBar.style.width = (((cat + 1) / (tCount + 1)) * 100).toString() + "%"
                if (statusTxt.classList.contains("text-bg-info")) statusTxt.classList.replace("text-bg-info", "text-bg-warning")
                if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-warning")
                statusTxt.innerText = `Finding Messages in ${labelIds[cat]}`
                gapi.client.gmail.users.messages.list({
                    'userId': 'me',
                    'labelIds': [labelIds[cat]],
                    'includeSpamTrash': 'true',
                    'maxResults': 500,
                    'pageToken': nextPageToken
                })
                    .then(r => {
                        if (r.result.messages) {
                            emailList = [...emailList, ...r.result.messages]
                            if (r.result.nextPageToken) {
                                getMails(cat, r.result.nextPageToken)
                            } else {
                                if (cat == labelIds.length - 1) {
                                    let emailIdList = []
                                    emailList.forEach(element => {
                                        emailIdList.push(element.id)
                                    });
                                    statusTxt.innerText = "Deleting Messages"
                                    deleteEmails(emailIdList)
                                } else {
                                    getMails(cat + 1)
                                }
                            }
                        } else if (cat != labelIds.length - 1) {
                            getMails(cat + 1)
                        } else if (cat == labelIds.length - 1) {
                            showDoneMessage(1)
                        }
                    })
                    .catch(err => {
                        if (progressBar.classList.contains("bg-warning")) progressBar.classList.replace("bg-warning", "bg-danger")
                        if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-danger")
                        statusTxt.innerText = `An error occurred. Error is as follows: ${err}`
                        console.error(err)
                    })
            } else {
                statusTxt.innerText = "Getting Access Token"
                await getToken()
                getMails()
            }
        } else if (cat != labelIds.length - 1) {
            getMails(cat + 1)
        } else if (cat == labelIds.length - 1) {
            showDoneMessage(1)
        }
    } else {
        if (gapi.client.getToken()) {
            progressBar.style.width = "50%"
            if (statusTxt.classList.contains("text-bg-info")) statusTxt.classList.replace("text-bg-info", "text-bg-warning")
            if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-warning")
            statusTxt.innerText = `Finding Messages from ${fromTxt.value}`
            gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'q': `from:${fromTxt.value}`,
                'includeSpamTrash': 'true',
                'maxResults': 500,
                'pageToken': nextPageToken
            })
                .then(r => {
                    if (r.result.messages) {
                        emailList = [...emailList, ...r.result.messages]
                        if (r.result.nextPageToken) {
                            getMails(cat, r.result.nextPageToken)
                        } else {
                            let emailIdList = []
                            emailList.forEach(element => {
                                emailIdList.push(element.id)
                            });
                            statusTxt.innerText = "Deleting Messages"
                            deleteEmails(emailIdList)
                        }
                    } else{
                        showDoneMessage(1)
                    }
                })
                .catch(err => {
                    if (progressBar.classList.contains("bg-warning")) progressBar.classList.replace("bg-warning", "bg-danger")
                    if (progressBar.classList.contains("bg-info")) progressBar.classList.replace("bg-info", "bg-danger")
                    statusTxt.innerText = `An error occurred. Error is as follows: ${err}`
                    console.error(err)
                })
        } else {
            statusTxt.innerText = "Getting Access Token"
            await getToken()
            getMails()
        }
    }
}

function deleteEmails(idsList) {
    progressBar.style.width = "90%"
    gapi.client.gmail.users.messages.batchDelete({
        'userId': 'me',
        'resource': { 'ids': idsList }
    }).then(r => console.log(r))
    showDoneMessage(0, idsList.length)
}

function showDoneMessage(status, length = 0) {
    progressBar.style.width = "100%"
    progressBar.classList.replace('bg-warning', 'bg-success')
    progressBar.classList.remove('progress-bar-animated')
    statusTxt.classList.replace('text-bg-warning', 'text-bg-success')
    if (status == 0) {
        statusTxt.innerText = `Deleted ${length} Messages`
    } else {
        statusTxt.innerText = 'No Messages Found'
    }
    emailList = []
}

function revokeToken() {
    let cred = gapi.client.getToken();
    if (cred !== null) {
        google.accounts.oauth2.revoke(cred.access_token, () => { });
        gapi.client.setToken('');
        document.getElementById("revokeBtn").classList.add('d-none')
    }
}