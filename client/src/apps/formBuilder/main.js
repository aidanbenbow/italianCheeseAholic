import { createPageSwitcher } from "./layout/pageSwitcher.js";
import { AppCommandsModule } from "./modules/appCommandModule.js";
import { createResultsPage } from "./render/createResultsPage.js";
import { renderForm } from "./render/formRenderer.js";
import { createFormBuilderCrudStore } from "./state/crudStore.js";
import { createViewFormPage } from "./ui/pages/viewForm.js";

let commansdModule = null;


export async function mount(engine) {
commansdModule = new AppCommandsModule(engine);
engine.addModule(commansdModule);

const crud = createFormBuilderCrudStore(engine);
const pageSwitcher = createPageSwitcher(engine);

const form = await crud.loadOne("form_1");
console.log("Loaded form:", form);

const viewForm = renderForm(engine, form);

//load submissions for form
const submissions = form.results || [];

const resultsPage = createResultsPage(engine, form, submissions);

pageSwitcher.show(viewForm);
//pageSwitcher.show(resultsPage);

}


