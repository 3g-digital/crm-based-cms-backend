const express = require('express');
const router = express.Router();
const authToken = require('../middleware/authToken');
const { loginController } = require('../controllers/user/loginController');
const getAdminUsersController = require('../controllers/admin/getAdminUsersController');
const addAdminUserController = require('../controllers/admin/addAdminUserController');
const getManagersController = require('../controllers/admin/getManagersController');
const addManagerController = require('../controllers/admin/addManagerController');
const getTechniciansController = require('../controllers/admin/getTechniciansController');
const addTechnicianController = require('../controllers/admin/addTechnicianController');
const getBranchesController = require('../controllers/admin/getBranchesController');
const addBranchController = require('../controllers/admin/addBranchController');
const updateUserStatusController = require('../controllers/admin/updateUserStatusController');
const search = require('../controllers/Lead/search');
const getAllLeads = require('../controllers/Lead/getAllLeads');
const createLead = require('../controllers/Lead/createLead');
const getLead = require('../controllers/Lead/getLead');
const updateLead = require('../controllers/Lead/updateLead');
const addRemark = require('../controllers/Lead/addRemark');
const convertToCustomer = require('../controllers/Lead/convertToCustomer');
const getAllCustomers = require('../controllers/customer/getAllCustomers');
const createCustomer = require('../controllers/customer/createCustomer');
const getCustomer = require('../controllers/customer/getCustomer');
const updateCustomer = require('../controllers/customer/updateCustomer');
const getAllInventory = require('../controllers/inventory/getAllInventory');
const getInventory = require('../controllers/inventory/getInventory');
const createInventory = require('../controllers/inventory/createInventory');
const stockAdd = require('../controllers/inventory/stockAdd');
const updateInventory = require('../controllers/inventory/updateInventory');
const deleteInventory = require('../controllers/inventory/deleteInventory');
const checkSerialNumber = require('../controllers/inventory/checkSerialNumber');
const getBranchTechniciansController = require('../controllers/manager/getBranchTechniciansController');
const managerAddTechnicianController = require('../controllers/manager/managerAddTechnicianController');
const getUserController = require('../controllers/user/getUserController');
const updateUserController = require('../controllers/user/updateUserController');
const deleteUserController = require('../controllers/user/deleteUserController');
const getInventoryByType = require('../controllers/inventory/getInventoryByType');
const getNewBranchManagersController = require('../controllers/manager/getNewBranchManagersController');
const checkManagerStatusController = require('../controllers/manager/checkManagerStatusController');
const initiateTransferController = require('../controllers/manager/initiateTransferController');
const acceptTransferController = require('../controllers/manager/acceptTransferController');
const rejectTransferController = require('../controllers/manager/rejectTransferController');
const rejectTechnicianProjectTransfer = require('../controllers/manager/rejectTechnicianProjectTransfer');
const getRejectedTransfersController = require('../controllers/manager/getRejectedTransfersController');
const getAllWorkOrders = require('../controllers/customer/getAllWorkOrders');
const createWorkOrder = require('../controllers/customer/createWorkOrder');
const assignTechnician = require('../controllers/customer/assignTechnician');
const assignInventoryToTechnician = require('../controllers/inventory/assignInventoryToTechnician');
const getTechnicianInventory = require('../controllers/technician/getTechnicianInventory');
const getTechnicianWorkOrders = require('../controllers/technician/getTechnicianWorkOrders');
const updateWorkOrderStatus = require('../controllers/technician/updateWorkOrderStatus');
const getTechnicianActiveProject = require('../controllers/technician/getTechnicianActiveProject');
const createWorkOrderBill = require('../controllers/technician/createWorkOrderBill');
const confirmWorkOrderBill = require('../controllers/technician/confirmWorkOrderBill');
const completeWorkOrder = require('../controllers/technician/completeWorkOrder');
const getWorkOrderDetails = require('../controllers/technician/getWorkOrderDetails');
const getTransferHistory = require('../controllers/manager/getTransferHistory');
const returnInventoryToManager = require('../controllers/technician/returnInventoryToManager');
const getManagerProjects = require('../controllers/manager/getManagerProjects');
const approveWorkOrder = require('../controllers/manager/approveWorkOrder');
const getBillDetails = require('../controllers/manager/getBillDetails');
const rejectBill = require('../controllers/manager/rejectBill');
const getTechnicianProjects = require('../controllers/technician/getTechnicianProjects');
const addWorkOrderRemark = require('../controllers/technician/addWorkOrderRemark');
const getReturnedInventory = require('../controllers/manager/getReturnedInventory');
const confirmReturnedInventory = require('../controllers/manager/confirmReturnedInventory');
const acceptTechnicianProjectTransfer = require('../controllers/manager/acceptTechnicianProjectTransfer');
const getSerialNumberDetails = require('../controllers/manager/getSerialNumberDetails');
const updateSerialNumberStatus = require('../controllers/technician/updateUsedSerialNumbers');
const registerWarrantyReplacement = require('../controllers/manager/registerWarrantyReplacement');
const getAllWarrantyReplacements = require('../controllers/manager/getAllWarrantyReplacements');
const completeWarrantyReplacement = require('../controllers/manager/completeWarrantyReplacement');
const getTechnicianInventoryHistory = require('../controllers/technician/getTechnicianInventoryHistory');
const getManagerByIdController = require('../controllers/admin/getManagerByIdController');
const changePasswordController = require('../controllers/user/changePasswordController');
const adminChangePasswordController = require('../controllers/admin/adminChangePasswordController');
const getReplacementHistory = require('../controllers/manager/getReplacementHistory');
const checkWarrantyStatus = require('../controllers/manager/checkWarrantyStatus');
const findByReplacementSerial = require('../controllers/manager/findByReplacementSerial');
const updateWarrantyClaim = require('../controllers/manager/updateWarrantyClaim');
const { resetSystem } = require('../controllers/user/resetSystem');


// Login 
router.post("/login", loginController);

// User
router.get("/get-user/:id", authToken, getUserController);
router.post("/update-user/:id", authToken, updateUserController);
router.delete("/delete-user/:id", authToken, deleteUserController);
router.post("/change-password/:id", authToken, changePasswordController);
router.post("/reset-system", authToken, resetSystem);

// Admin
router.get("/get-admins", authToken, getAdminUsersController);
router.post("/add-admins", authToken, addAdminUserController);
router.get("/get-managers", authToken, getManagersController);
router.post("/add-managers", authToken, addManagerController);
router.get("/get-technicians", authToken, getTechniciansController);
router.post("/add-technicians", authToken, addTechnicianController);
router.get("/get-branches", authToken, getBranchesController);
router.post("/add-branches", authToken, addBranchController);
router.post("/user-status", authToken, updateUserStatusController);
router.get("/get-manager-detail/:managerId", authToken, getManagerByIdController);
router.post("/admin-change-password/:id", authToken, adminChangePasswordController);

// Manager
router.get("/manager-get-technician", authToken, getBranchTechniciansController);
router.post("/manager-add-technician", authToken, managerAddTechnicianController);
router.get("/new-managers", authToken, getNewBranchManagersController);
router.get("/manager-status", authToken, checkManagerStatusController);
router.post("/initiate-transfer", authToken, initiateTransferController);
router.post("/accept-transfer/:transferId", authToken, acceptTransferController);
router.post("/reject-transfer/:transferId", authToken, rejectTransferController);
router.get("/get-rejected-transfers", authToken, getRejectedTransfersController);
router.get("/get-transfer-history", authToken, getTransferHistory);
router.get("/get-manager-projects", authToken, getManagerProjects);
router.post("/approve-order", authToken, approveWorkOrder);
router.get("/get-bill-details/:id", authToken, getBillDetails);
router.post("/accept-technician-project-transfer", authToken, acceptTechnicianProjectTransfer);
router.post("/reject-technician-project-transfer", authToken, rejectTechnicianProjectTransfer);
router.get("/get-returned-inventory", authToken, getReturnedInventory);
router.post("/confirm-returned-inventory/:returnId", authToken, confirmReturnedInventory);
router.get("/serial-number-detail/:serialNumber", authToken, getSerialNumberDetails);
router.post("/register-replacement", authToken, registerWarrantyReplacement);
router.get("/get-replacements", authToken, getAllWarrantyReplacements);
router.post("/complete-replacement", authToken, completeWarrantyReplacement);
router.get("/serial-number-history/:serialNumber", authToken, getReplacementHistory);
router.get("/check-warranty-status/:serialNumber", authToken, checkWarrantyStatus);
router.get("/replaced-serial-number/:serialNumber", authToken, findByReplacementSerial);
router.post("/warranty-claim", authToken, updateWarrantyClaim);

// Technician
router.get("/technician-work-orders", authToken, getTechnicianWorkOrders);
router.post("/update-work-status", authToken, updateWorkOrderStatus);
router.get("/technician-active-projects", authToken, getTechnicianActiveProject);
router.post("/create-bill", authToken, createWorkOrderBill);
router.post("/confirm-order-bill", authToken, confirmWorkOrderBill);
router.post("/complete-work-order", authToken, completeWorkOrder);
router.get("/get-work-order-details/:customerId/:orderId", authToken, getWorkOrderDetails);
router.post("/return-inventory", authToken, returnInventoryToManager);
router.get("/get-technician-projects/:technicianId", authToken, getTechnicianProjects);
router.post("/remark-add", authToken, addWorkOrderRemark);
router.post("/update-serial-status", authToken, updateSerialNumberStatus);
router.get("/get-inventory-history/:technicianId", authToken, getTechnicianInventoryHistory);

// Lead
router.get("/search", authToken, search);
router.get("/get-all-leads", authToken, getAllLeads);
router.post("/create-Lead", authToken, createLead);
router.get("/get-single-lead/:id", authToken, getLead);
router.post("/update-lead/:id", authToken, updateLead);
router.post("/lead-remarks/:id", authToken, addRemark);
router.post("/lead-convert/:id", authToken, convertToCustomer)

// Customer
router.get("/get-all-customers", authToken, getAllCustomers);
router.post("/create-customer", authToken, createCustomer);
router.get("/get-single-customer/:id", authToken, getCustomer);
router.post("/update-customer/:id", authToken, updateCustomer);
router.get("/get-work-orders", authToken, getAllWorkOrders);
router.post("/create-work-orders", authToken, createWorkOrder);
router.post("/assign-technician", authToken, assignTechnician);

// Inventory
router.get("/get-all-inventory", authToken, getAllInventory);
router.get("/get-single-inventory/:id", authToken, getInventory);
router.post("/create-inventory", authToken, createInventory);
router.post("/add-stock", authToken, stockAdd);
router.post("/update-inventory/:id", authToken, updateInventory);
router.post("/delete-inventory/:id", authToken, deleteInventory);
router.get("/check-serial/:serialNumber", authToken, checkSerialNumber);
router.get("/inventory-by-type/:type", authToken, getInventoryByType);
router.post("/assign-inventory-technician", authToken, assignInventoryToTechnician);
router.get("/get-technician-inventory", authToken, getTechnicianInventory);


router.post("/reject-technician-project-transfer", authToken, rejectTechnicianProjectTransfer);
router.post("/reject-bill", authToken, rejectBill);

module.exports = router;
