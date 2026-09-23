const storage = (typeof browser !== 'undefined') ? browser.storage : chrome.storage;


const saveOptions = async () => {
  const cdmUrl = document.getElementById('cdmUrl').value;

  await storage.sync.set(
    { cdmUrl: cdmUrl },
    () => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

const restoreOptions =  async () => {
  const options = await storage.sync.get('cdmUrl');
  document.getElementById('cdmUrl').value = options.cdmUrl.toString();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
