var isClose = true;
const stopwords = ["of", "the", "a", "an", "any", "is", "can", "who", "what", "why", "whom", "from", "belongs"];
var editor = "sorts\n" +
"   #diseases = { fever, cold, thyroid, hives, diabetes }.\n" +
"   #medicine = { aspirin, antihistamines, tapazole, loratadine, insulin }.\n" +
"   #causes = { allergy, genetics, virus }.\n" +
"   #diagnosis = { bloodtest, physical_examination }.\n" +
"   #prevention = { vaccination, hygiene }.\n" +
"predicates\n" +
"   treatment(#medicine, #diseases).\n" +
"   caution(#prevention, #diseases).\n" +
"   detection(#diagnosis, #diseases).\n" +
"   reason(#causes, #diseases).\n" +
"rules\n" +
"   treatment(aspirin, fever).\n" +
"   treatment(antihistamines, cold).\n" +
"   caution(vaccination, cold).\n" +
"   caution(hygiene, hives).\n" +
"   detection(bloodtest, thyroid).\n" +
"   detection(physical_examination, hives).\n" +
"   reason(virus, cold).\n" +
"   reason(genetics, thyroid).";

var contstring = editor.split("sorts\n")[1].split("predicates\n");
var sortstring = contstring[0].split('.');
sortstring.splice(-1, 1);
var sorts = {};
sortstring = sortstring.map(d => d.replace(/\n/g, '').trim()).forEach(d => {
    var par = d.split("=");
    sorts[par[0].replace(/#/, '').trim()] = par[1].replace(/{|}/g, '').split(',').map(w => w.trim())
});
// predicates
var predicates = {};
contstring = contstring[1].split("rules\n");
sortstring = contstring[0].split('.');
sortstring.splice(-1, 1);
sortstring.forEach(d => {
    var part = d.replace(/\n/g, '').trim().split('(');
    var func = part[0];
    predicates[func] = {};
    var par = part[1].split(',').map(e => e.replace(/#|\)/g, '').trim());
    var par1 = sorts[par[0]].slice();
    par1.push("X");
    par.splice(0, 1);
    par1.forEach(e => {
        var strinh = (e == 'X' ? '' : (e + ' ')) + func;
        predicates[func][strinh] = func + "(" + e + ")";
        par.forEach(par2 => {
            var temp = sorts[par2].slice();
            temp.push("X");
            temp.forEach(t => {
                var strinh = (e == 'X' ? '' : (e + ' ')) + func + (t == 'X' ? '' : (' ' + t));
                // if (strinh != fubnc)
                predicates[func][strinh] = func + "(" + e + "," + t + ")";
            })
        });
    });
});


var all_predicates = [];
for (var key1 in predicates) {
    if (predicates.hasOwnProperty(key1)) {
        for (var key2 in predicates[key1]) {
            if (predicates[key1].hasOwnProperty(key2))
                all_predicates.push(key2);
        }
    }

}
// all_predicates.push('speak spanish'); // extra terms
a = FuzzySet(all_predicates);

console.log(all_predicates)


// Speech recognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';

// Get DOM elements
const answerDiv = document.querySelector('#answer');
const voiceBtn = document.getElementById('voice-input-btn');
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');
const answerBox = document.getElementById('answer-box');

submitBtn.addEventListener('click', () => {
    const question = textInput.value;
    if (question.trim() === '') {
        answerBox.innerHTML = 'Please ask a question.';
        return;
    }
    var trim_script = question.split(" ");
    trim_script = trim_script.filter(f => !stopwords.includes(f));
    var queryQues = a.get(trim_script.join(" "), null, 0.5);
    getAnswer(queryQues);

});

// Handle speech recognition
recognition.onresult = event => {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    textInput.value = transcript;

    var trim_script = transcript.split(" ");
    trim_script = trim_script.filter(f => !stopwords.includes(f));
    var queryQues = a.get(trim_script.join(" "), null, 0.5);
    console.log(queryQues);
    getAnswer(queryQues);
};

// Handle click on voice input button     
function startSpeechRecognition() {
    recognition.start();
}
voiceBtn.addEventListener('click', startSpeechRecognition);


function getAnswer(question) {

    if (question != null) {
        var mainkey = question[0][1].replace('speak ', '');
        var answerarr = mainkey.split(' ');
        var key1 = '';
        answerarr.forEach(d => {
            key1 = (predicates[d] != undefined) ? d : key1;
        });
        //var key1 = answerarr.length>2? answerarr[1]:answerarr[0];
        var key2 = mainkey;
        console.log(key1 + '-' + key2);
        console.log(predicates[key1][key2]);

        var data = {
            'action': "getQuery",
            'query': predicates[key1][key2],
            'editor': editor
        };

        console.log(data)



        $.ajax({
            url: "https://cors-anywhere.herokuapp.com/http://wave.ttu.edu/ajax.php",
            type: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            },
            data: {
                action: "getQuery",
                query: predicates[key1][key2],
                editor: editor
            },
            success: function (response) {
                console.log(response);
                const answer = response || 'Sorry, I could not find an answer.';
                answerDiv.innerHTML = answer;
                answerBox.innerHTML = answer;
            },
            error: function (xhr, status, error) {
                console.log("error: " + error);
            }
        });


    }
    else {
        const answer = 'Sorry, I could not find an answer.';
        answerDiv.innerHTML = answer;
        answerBox.innerHTML = answer;
    }
}
