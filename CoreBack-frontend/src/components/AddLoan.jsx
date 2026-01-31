import { useState } from "react";
import LoanService from "../services/loan.service";
import { useNavigate } from "react-router-dom";

function AddLoan() {
  const [loan, setLoan] = useState({
    clientId: "",
    toolId: "",
    startDate: "",
    dueDate: ""
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoan({ ...loan, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    LoanService.create(loan)
      .then(() => {
        navigate("/loans");
      })
      .catch((e) => {
        console.error("Error creating loan:", e);
      });
  };

  return (
    <div>
      <h2>Add Loan</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Client ID: </label>
          <input type="number" name="clientId" value={loan.clientId} onChange={handleChange} required />
        </div>

        <div>
          <label>Tool ID: </label>
          <input type="number" name="toolId" value={loan.toolId} onChange={handleChange} required />
        </div>

        <div>
          <label>Start Date: </label>
          <input type="date" name="startDate" value={loan.startDate} onChange={handleChange} required />
        </div>

        <div>
          <label>Due Date: </label>
          <input type="date" name="dueDate" value={loan.dueDate} onChange={handleChange} required />
        </div>

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default AddLoan;
