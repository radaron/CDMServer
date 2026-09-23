const storage = (typeof browser !== 'undefined') ? browser.storage : chrome.storage;

const addButtonAfterMovieName = () => {
    const movieTitleDivElement = document.querySelector('[data-testid=hero__primary-text]').parentElement
    if (movieTitleDivElement && !document.querySelector('.cdm-button')) {
        const button = document.createElement('button');

        button.className = 'cdm-button';
        const buttonText = 'CDM';
        buttonText.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.innerText = char;
            span.className = `cdm-button__char-${index}`;
            button.appendChild(span);
        });

        button.onclick = async () => {
            const url = window.location.href;
            const imdbId = url.split('/').find(part => part.startsWith('tt'));
            const cdmUrl = await storage.sync.get('cdmUrl');
            if (imdbId) {
                window.open(
                    `${cdmUrl.cdmUrl}/manage/download?`
                    +`pattern=${imdbId}&searchWhere=imdb&searchCategory=all_own`,
                    '_blank'
                );
            }
        };
        movieTitleDivElement.appendChild(button);
    }
};

// Inject the CSS file into the page
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('src/content.css');
document.head.appendChild(link);


// Use MutationObserver to detect when the parent element is rendered
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            const movieTitleDivElement = document.querySelector('[data-testid=hero__primary-text]');
            if (movieTitleDivElement) {
                addButtonAfterMovieName();
                observer.disconnect(); // Stop observing once the button is added
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });