-- ==============================================================================================================
-- USERS (EP. 7)
-- ==============================================================================================================
INSERT INTO users (username, password, role) VALUES 
('diego', 'diego123', 'ADMIN'),
('juan', 'juan123', 'EMPLOYEE');

-- ==============================================================================================================
-- TARIFF (EP. 4)
-- ==============================================================================================================
INSERT INTO tariffs (daily_rent_fee, daily_late_fee, repair_fee) VALUES 
(1000, 5000, 10000);

-- ==============================================================================================================
-- CLIENTS (EP. 3) - 20 clientes, 17 ACTIVE y 3 RESTRICTED
-- ==============================================================================================================
INSERT INTO clients (name, rut, phone, email, status) VALUES 
('Germán Peralta'   ,'20.589.189-6'     ,'984998810'    ,'german.peralta@correo.com'  ,'ACTIVE'),
('Javier Torres'    ,'16.500.400-K'     ,'922334455'    ,'javier.torres@correo.com'   ,'ACTIVE'),
('Paula Guzmán'     ,'20.101.202-3'     ,'944556677'    ,'paula.guzman@correo.com'    ,'ACTIVE'),
('Marcos Loyola'    ,'15.654.321-0'     ,'987650001'    ,'marcos.loyola@correo.com'   ,'ACTIVE'),
('Isidora Naranjo'  ,'23.400.100-9'     ,'950009876'    ,'isidora.naranjo@correo.com' ,'ACTIVE'),
-- ==============================================================================================================
('Benjamín Ríos'    ,'14.123.456-5'     ,'961112233'    ,'benjamin.rios@correo.com'   ,'ACTIVE'),
('Sofía Cáceres'    ,'21.789.000-1'     ,'972223344'    ,'sofia.caceres@correo.com'   ,'ACTIVE'),
('Manuel Castro'    ,'18.987.654-2'     ,'983334455'    ,'manuel.castro@correo.com'   ,'ACTIVE'),
('Daniela Pino'     ,'20.304.050-7'     ,'994445566'    ,'daniela.pino@correo.com'    ,'ACTIVE'),
('Vicente Araya'    ,'17.111.222-3'     ,'915556677'    ,'vicente.araya@correo.com'   ,'ACTIVE'),
-- ==============================================================================================================
('Fernanda Soto'    ,'22.000.100-4'     ,'926667788'    ,'fernanda.soto@correo.com'   ,'ACTIVE'),
('Maria Gonzalez'   ,'20.777.373-9'     ,'987654321'    ,'maria.gonzalez@correo.com'  ,'ACTIVE'),
('Andrea Soto'      ,'19.456.789-2'     ,'955443322'    ,'andrea.soto@correo.com'     ,'ACTIVE'),
('Felipe Muñoz'     ,'18.321.098-7'     ,'966778899'    ,'felipe.munoz@correo.com'    ,'ACTIVE'),
('Camila Rojas'     ,'21.012.345-K'     ,'977889900'    ,'camila.rojas@correo.com'    ,'RESTRICTED'),
-- ==============================================================================================================
('Ricardo Díaz'     ,'17.876.543-1'     ,'933221100'    ,'ricardo.diaz@correo.com'    ,'RESTRICTED'),
('Elena Vargas'     ,'22.999.888-5'     ,'911223344'    ,'elena.vargas@correo.com'    ,'RESTRICTED'),
('Miguel Lagos'     ,'16.707.808-8'     ,'937778899'    ,'miguel.lagos@correo.com'    ,'RESTRICTED'),
('Miguel Cárcamo'   ,'16.789.827-K'     ,'934448899'    ,'miguel.carcamo@correo.com'  ,'RESTRICTED'),
('Loreto Núñez'     ,'23.123.987-0'     ,'948889900'    ,'loreto.nunez@correo.com'    ,'RESTRICTED');

-- ==============================================================================================================
-- TOOLS (Épica 1) - 30 herramientas en 5 categorías - 6 DECOMMISSIONED, 4 REPAIRING, 21 AVAILABLE
-- ==============================================================================================================
INSERT INTO tools (name, category, status, stock, in_repair, replacement_value) VALUES
('Sierra Caladora Inalámbrica'  ,'Carpentry'        ,'AVAILABLE'        ,5  ,0 ,30000),
('Cepilladora Eléctrica'        ,'Carpentry'        ,'AVAILABLE'        ,10 ,0 ,55000),
('Serrucho de Costilla'         ,'Carpentry'        ,'AVAILABLE'        ,15 ,0 ,7000),
('Gubia para Madera'            ,'Carpentry'        ,'DECOMMISSIONED'   ,0  ,0 ,4000),
('Sargento Fijo (Grande)'       ,'Carpentry'        ,'DECOMMISSIONED'   ,0  ,0 ,15000),
('Lijadora Orbital'             ,'Carpentry'        ,'REPAIRING'        ,0  ,55 ,40000),
-- ======================================================================================
('Taladro Bosch (Heavy Duty)'   ,'Electric Tools'   ,'AVAILABLE'        ,5  ,0 ,45000),
('Atornillador de Impacto'      ,'Electric Tools'   ,'AVAILABLE'        ,10 ,0 ,35000),
('Multiherramienta Oscilante'   ,'Electric Tools'   ,'AVAILABLE'        ,15 ,0 ,28000),
('Pistola de Calor'             ,'Electric Tools'   ,'DECOMMISSIONED'   ,0  ,0 ,10000),
('Sierra Circular Makita'       ,'Electric Tools'   ,'REPAIRING'        ,0  ,55 ,60000),
('Amoladora Angular'            ,'Electric Tools'   ,'REPAIRING'        ,0  ,55 ,30000),
-- ======================================================================================
('Martillo Stanley (Curvo)'     ,'Hand Tools'       ,'AVAILABLE'        ,10 ,0 ,8000),
('Set de Llaves Allen'          ,'Hand Tools'       ,'AVAILABLE'        ,15 ,0 ,6000),
('Nivel de Burbuja 60cm'        ,'Hand Tools'       ,'AVAILABLE'        ,30 ,0 ,9000),
('Alicate Universal'            ,'Hand Tools'       ,'AVAILABLE'        ,60 ,0 ,5000),
('Cinta Métrica 5m'             ,'Hand Tools'       ,'DECOMMISSIONED'   ,0  ,0 ,3000),
('Llave Francesa Ajustable'     ,'Hand Tools'       ,'DECOMMISSIONED'   ,0  ,0 ,5000),
-- ======================================================================================
('Soplete de Propano'           ,'Plumbing'         ,'AVAILABLE'        ,5  ,0 ,22000),
('Cortatubos de Cobre'          ,'Plumbing'         ,'AVAILABLE'        ,5  ,0 ,15000),
('Llave Stilson 18"'            ,'Plumbing'         ,'AVAILABLE'        ,5  ,0 ,18000),
('Desatascador de Serpiente 7m' ,'Plumbing'         ,'AVAILABLE'        ,5  ,0 ,12000),
('Bomba de Succión Manual'      ,'Plumbing'         ,'AVAILABLE'        ,5  ,0 ,11000),
('Máquina Roscadora Manual'     ,'Plumbing'         ,'DECOMMISSIONED'   ,0  ,0 ,25000),
-- ======================================================================================
('Tijera de Podar Telescópica'  ,'Gardening'        ,'AVAILABLE'        ,10  ,0 ,15000),
('Carretilla Reforzada'         ,'Gardening'        ,'AVAILABLE'        ,10  ,0 ,20000),
('Pala Punta Redonda'           ,'Gardening'        ,'AVAILABLE'        ,15  ,0 ,9500),
('Rastrillo Metálico'           ,'Gardening'        ,'AVAILABLE'        ,15  ,0 ,6000),
('Manguera Retráctil 20m'       ,'Gardening'        ,'AVAILABLE'        ,15  ,0 ,28000),
('Motosierra Eléctrica'         ,'Gardening'        ,'REPAIRING'        ,0   ,55 ,55000);

-- ==============================================================================================================
-- LOANS (Épica 2) - 15 Préstamos: 5 ACTIVE, 7 LATE, 3 CLOSED
-- Notas: Los préstamos activos y atrasados utilizan CLIENTES ACTIVOS (IDs 8-12).
--        Los préstamos cerrados con multa utilizan CLIENTES RESTRINGIDOS (IDs 1-7, 18-20).
-- ==============================================================================================================
-- 5 ACTIVE LOANS (Vigentes - Reporte Activo)
INSERT INTO loans (client_id, tool_id, start_date, due_date, status, total_penalty) VALUES
(1, 1,  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '5 days',  'ACTIVE', 0),
(2, 2,  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '5 days',  'ACTIVE', 0),
(3, 3,  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '5 days',  'ACTIVE', 0),
(4, 7,  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '5 days',  'ACTIVE', 0),
(5, 8,  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '5 days',  'ACTIVE', 0);

-- ==============================================================================================================
-- 3 LATE LOANS (Atrasados - Reporte Atrasado/Clientes Atrasados)
INSERT INTO loans (client_id, tool_id, start_date, due_date, status, total_penalty) VALUES
(15, 1,  CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '7 days', 'LATE', 0),
(16, 2,  CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '7 days', 'LATE', 0),
(17, 3,  CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '7 days', 'LATE', 0);

-- ==============================================================================================================
-- 3 RECEIVED LOANS (RECEIVED - Usados para historial de multas y Kardex)
INSERT INTO loans (client_id, tool_id, start_date, due_date, return_date, status, total_penalty) VALUES
-- Cliente 18 (Miguel Lagos - RESTRICTED): Devuelto 1 día tarde. Multa = (1 * 5000) + (10 * 1000).
(18, 13, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '19 days', 'RECEIVED', 15000), 
-- Cliente 19 (Miguel Cárcamo - RESTRICTED): Devuelto 3 días tarde. Multa = (3 * 5000) + (10 * 1000).
(19, 14, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '12 days', 'RECEIVED', 25000),
-- Cliente 20 (Loreto Núñez - RESTRICTED): Devuelto a tiempo, con cargo por reparación. Cargo = 10000 + (10 * 1000).
(20, 15, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'RECEIVED', 20000);

