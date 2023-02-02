import { NavLink } from "react-router-dom";

const Navigation =()=>{
    return (
        <>
            <div className="navigation">
                <ul>
                    <NavLink to="/">
                        <li>Level Editor</li>
                    </NavLink>
                    <NavLink to="/state-editor">
                        <li>State Editor</li>
                    </NavLink>
                </ul>
            </div>
        </>
    )
}
export default Navigation