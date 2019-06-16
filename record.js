
const $video = $('#video');
const video = $video.get(0);
const $btnStart = $('#btn-start');
const btnStart = $btnStart.get(0);
const $btnStop = $('#btn-stop');
const btnStop = $btnStop.get(0);
const $list = $('#record-list');

let recording = false;
let captureStream = null;
let recorder = null;

let records = {};

async function startCapture() {

    if (captureStream) return;

    let options = {
        video: true,
        audio: $('#i-audio').prop('checked'),
        cursor: $('#s-cursor').val()
    };

    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(options);
    } catch (err) {
        alert(err.message);
        return;
    }

    btnStart.disabled = true;
    btnStop.disabled = false;

    video.autoplay = true;
    video.srcObject = captureStream;

    recorder = new MediaRecorder(captureStream);
    recorder.start();

    captureStream.getVideoTracks()[0].onended = () => {
        recorder.stop();
    };

    recorder.addEventListener('dataavailable', (evt) => {
        let videoUrl = URL.createObjectURL(evt.data, {
            type: 'video/webm'
        });
        let recordId = captureStream.id;

        captureStream = null;

        createRecord(recordId, {
            url: videoUrl,
            name: new Date().toISOString().replace(/\..+$/, '').replace('T', ' ').replace('Z', '').replace(/:/g, '-')
        });
        renameRecord(recordId);
        selectRecord(recordId);

        btnStart.disabled = false;
        btnStop.disabled = true;
    });
}

function stopCapture() {
    if (!captureStream) return;

    captureStream.getTracks().forEach(track => track.stop());
    recorder.stop();
}

function createRecord(id, data) {
    records[id] = data;
    let $div = $('<div class="record-item">');
    $div.attr('data-id', id)
        .append($('<a class="record-item-name" data-action="select" href="javascript:void(0)">').text(data.name))
        .append($('<a class="record-item-btn" data-action="rename" href="javascript:void(0)">').text('Rename'))
        .append($('<a class="record-item-btn" data-action="save" href="javascript:void(0)">').text('Save'))
        .append($('<a class="record-item-btn" data-action="remove" href="javascript:void(0)">').text('Remove'));
    $list.append($div);
    data.dom = $div.get(0);
}

function selectRecord(id) {
    if (captureStream) return;

    let record = records[id];

    video.autoplay = false;
    video.srcObject = null;
    video.src = record.url;
}

function renameRecord(id) {
    let record = records[id];
    let name = prompt('Rename this record:', record.name);
    if (name) {
        record.name = name;
        $(record.dom).find('a.record-item-name').text(name);
    }
}

function saveRecord(id) {
    let record = records[id];
    let $a = $('<a>');
    $a.attr('href', record.url);
    $a.attr('download', record.name + '.webm');
    $('body').append($a);
    $a.get(0).click();
    $a.remove();
}

function removeRecord(id) {
    let record = records[id];
    URL.revokeObjectURL(record.url);
    $(record.dom).remove();
    delete records[id];
}

$btnStart.click(startCapture);
$btnStop.click(stopCapture);
$list.on('click', '.record-item > a[data-action]', function() {
    var $this = $(this);
    var $item = $this.parents('.record-item');
    var action = $this.attr('data-action');
    var id = $item.attr('data-id');
    switch (action) {
        case 'select': {
            selectRecord(id);
            break;
        }
        case 'rename': {
            renameRecord(id);
            break;
        }
        case 'save': {
            saveRecord(id);
            break;
        }
        case 'remove': {
            removeRecord(id);
            break;
        }
    }
});