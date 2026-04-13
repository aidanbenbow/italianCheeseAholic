import { createPageSwitcher } from "./layout/pageSwitcher.js";
import { AppCommandsModule } from "./modules/appCommandModule.js";
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

pageSwitcher.show(viewForm);
//const viewFormPage = createViewFormPage(engine, "12345");
//pageSwitcher.show(viewFormPage);
}


