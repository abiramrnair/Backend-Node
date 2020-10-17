var subjects = [
    'ACTURSCI', 'AMERICAN', 'APPLMATH', 'ARABIC',   'AH',      
    'ASTRONOM', 'BIBLSTUD', 'BME',      'BIOSTATS', 'BUSINESS',
    'CALCULUS', 'CGS',      'CBE',      'CHEMBIO',  'CHEM',    
    'CHINESE',  'CHURCH',   'CEE',      'CLASSICS', 'COMMSCI', 
    'COMPLIT',  'COMPSCI',  'DANCE',    'DIGICOMM', 'DIGIHUM', 
    'EARTHSCI', 'ECONOMIC', 'ECE',      'ENGSCI',   'ENGLISH', 
    'EPIDEMIO', 'FIMS',     'FILM',     'FINMOD',   'FOODNUTR',
    'GEOGRAPH', 'GLE',      'GREEK',    'HEALTSCI', 'HEBREW',  
    'HISTSCI',  'HOMILET',  'HUMANECO', 'INDIGSTU', 'ICC',     
    'ITALIAN',  'JAPANESE', 'JEWISH',   'KINESIOL', 'LATIN',   
    'LS',       'LINGUIST', 'LITURGIC', 'MOS',      'MTP-MKTG',
    'MATH',     'MME',      'MSE',      'MIT',      'MEDHINFO',
    'MEDIEVAL', 'MTP-MMED', 'MCS',      'MUSIC',    'NEURO',
    'PASTTHEO', 'PERSIAN',  'PHARM',    'PHILST',   'PHILOSOP',
    'PORTUGSE', 'REHABSCI', 'RELEDUC',  'SACRTHEO', 'SCIENCE',
    'SOCSCI',   'SOCIOLOG', 'SE',       'SPEECH',   'SPIRTHEO',
    'STATS',    'SA',       'SYSTHEO',  'THEATRE',  'THEOETH',
    'THESIS',   'TJ',       'WOMENST',  'WRITING'
];

var selectbox = document.getElementById("select_subject");

for (i = 0; i < subjects.length; i++) {
    var newOption = document.createElement('option');
    var optionText = document.createTextNode(subjects[i]);
    newOption.appendChild(optionText);
    selectbox.appendChild(newOption);
}
