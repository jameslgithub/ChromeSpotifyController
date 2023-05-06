document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ from: 'popup', message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});

document.querySelector('#play').addEventListener('click', function () {
    chrome.runtime.sendMessage({ from: 'popup', message: 'play' }, function (response) {
        if (response.message === 'success') window.close();
    });
});

document.querySelector('#pause').addEventListener('click', function () {
    chrome.runtime.sendMessage({ from: 'popup', message: 'pause' }, function (response) {
        if (response.message === 'success') window.close();
    });
});