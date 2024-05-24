import { Form } from "react-bootstrap";

const StringComponent = ({ label, value }) => (
    <div>
        <label>{label}: </label>
        <input type="text" value={value} readOnly />
    </div>
);

const NumberComponent = ({ label, value }) => (
    <div>
        <label>{label}: </label>
        <input type="number" value={value} readOnly />
    </div>
);

export const BooleanFieldInspector = ({ label, value, onChange }) => (
    <div>
        <Form.Check type="switch" id="istrigger-switch" label={label} checked={value} onChange={onChange}/>
    </div>
);