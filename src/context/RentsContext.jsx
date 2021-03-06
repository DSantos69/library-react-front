import moment from 'moment';
import { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../configs/api';
import RentsDeleteDialog from '../views/Rents/Components/RentsDeleteDialog';
import RentsForm from '../views/Rents/Components/RentsForm';

export const RentsContext = createContext();

function RentsContextProvider({ children }) {
    const [rents, setRents] = useState([]);
    const [rentsDefaultFormValues, setRentsDefaultFormValues] = useState({});
    const [show, setShow] = useState(false);
    const [rentDeleteValues, setRentDeleteValues] = useState({});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [titleForm, setTitleForm] = useState('');
    const [id, setId] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setCountItens] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPage, setTotalPage] = useState(0);
    const [pageSize, setPageSize] = useState(0);
    const [bookSelectValue, setBookSelectValue] = useState(0);
    const [customerSelectValue, setCustomerSelectValue] = useState(0);
    const [previsaoEntrega, setPrevisaoEntrega] = useState();

    const getRents = () => {
        api.get('/aluguel?PageNumber=' + page + '&PageSize=' + rowsPerPage)
            .then((res) => {
                const alugueis = res.data;
                var paginate = JSON.parse(res.headers.pagination);

                setCountItens(paginate.totalCount);
                setCurrentPage(paginate.currentPage);
                setTotalPage(paginate.totalPage);
                setPageSize(paginate.pageSize);
                setRents(alugueis);
            })
            .catch(() => {
                toast.error('Não foi possivel conectar com o banco de dados');
            });
    };

    useEffect(() => {
        getRents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlerShow = () => {
        setTitleForm('Novo Aluguel');
        setShow(true);
    };

    const handleClose = () => {
        setRentsDefaultFormValues({});
        if (id) {
            setId('');
        }
        setBookSelectValue(0);
        setCustomerSelectValue(0);
        setPrevisaoEntrega(new Date());
        setShow(false);
    };

    const handlerEdit = (id, livroId, usuarioId, aluguelFeito, previsaoEntrega, devolucao) => {
        const rent = {
            livroId,
            usuarioId,
            aluguelFeito,
            previsaoEntrega,
            devolucao
        };
        console.log(rent);
        setRentsDefaultFormValues(rent);
        setId(id);
        setBookSelectValue(rent.livroId);
        setCustomerSelectValue(rent.usuarioId);
        setPrevisaoEntrega(previsaoEntrega);
        setTitleForm('Editar Aluguel');
        setShow(true);
    };

    const saveRent = (data) => {
        if (id) {
            api.put('/aluguel/' + id, {
                id: id,
                livroId: data.livroId,
                usuarioId: data.usuarioId,
                aluguelFeito: data.aluguelFeito,
                previsaoEntrega: data.previsaoEntrega,
                devolucao: data.devolucao
            })
                .then((response) => {
                    if (response !== null) {
                        handleClose();
                        getRents();
                        toast.success('Editado com sucesso!');
                    }
                })
                .catch((res) => {
                    console.log(res.response.data.errors);
                    const error = res.response.data.error;
                    toast.error(error);
                });
        } else {
            const dateToday = moment().format('YYYY-MM-DD');
            const previsao = moment(previsaoEntrega).format('YYYY-MM-DD');

            api.post('/aluguel', {
                livroId: bookSelectValue,
                usuarioId: bookSelectValue,
                aluguelFeito: dateToday,
                previsaoEntrega: previsao
            })
                .then((response) => {
                    if (response !== null) {
                        handleClose();
                        getRents();
                        toast.success('Salvo com sucesso!');
                        setBookSelectValue(0);
                    }
                })
                .catch((res) => {
                    console.log(res.response.data.errors);
                    const error = res.response.data.error;
                    toast.error(error);
                });
        }
    };

    const handlerDelete = (bookId) => {
        const deleteValues = {
            id: bookId
        };
        setRentDeleteValues(deleteValues);
        setShowDeleteDialog(true);
    };

    const closeDeleteConfirm = () => {
        if (id) {
            setId('');
        }
        setRentDeleteValues({});
        setShowDeleteDialog(false);
    };

    const deleteRent = () => {
        api.delete('aluguel/' + rentDeleteValues.id)
            .then((response) => {
                if (response !== null) {
                    closeDeleteConfirm();
                    getRents();
                    toast.success('Deletado(a) com sucesso!');
                }
            })
            .catch((response) => {
                const error = response.response.data.error;
                toast.error(error);
                closeDeleteConfirm();
            });
    };

    const paginate = (pag, row) => {
        api.get('/aluguel?PageNumber=' + pag + '&PageSize=' + row).then((res) => {
            const alugueis = res.data;
            var page = JSON.parse(res.headers.pagination);

            setCountItens(page.totalCount);
            setCurrentPage(page.currentPage);
            setTotalPage(page.totalPage);
            setPageSize(page.pageSize);

            setRents(alugueis);
        });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        setRents();
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(event.target.value);
        setPage(1);
        paginate(1, event.target.value);
    };

    const handleSearch = (data) => {
        api.get(
            '/aluguel?PageNumber=1&PageSize=100&Nome=' +
                data.nome +
                '&Autor=' +
                data.autor +
                '&Lancamento=' +
                data.lancamento
        )
            .then((res) => {
                setRents(res.data);
            })
            .catch(() => {
                toast.error('Não foi possível se conectar com o banco de dados');
            });
    };

    const completeRent = (data) => {
        const array = {
            id: data.id,
            livroId: data.livro.id,
            usuarioId: data.usuario.id,
            aluguelFeito: data.aluguelFeito,
            previsaoEntrega: data.previsaoEntrega,
            devolucao: moment().format('YYYY-MM-DD')
        };
        api.put('/aluguel/' + array.id, array)
            .then((res) => {
                toast.success('Livro entregue com sucesso');
                getRents();
            })
            .catch((err) => {
                console.log(err.response.data);
                toast.error(err.response.data.error);
            });
    };

    return (
        <RentsContext.Provider
            value={{
                rents,
                setRents,
                showDeleteDialog,
                rentDeleteValues,
                handlerEdit,
                rentsDefaultFormValues,
                handlerDelete,
                handlerShow,
                handleClose,
                closeDeleteConfirm,
                show,
                titleForm,
                saveRent,
                deleteRent,
                totalCount,
                currentPage,
                totalPage,
                pageSize,
                bookSelectValue,
                setBookSelectValue,
                rowsPerPage,
                handleChangePage,
                handleChangeRowsPerPage,
                handleSearch,
                customerSelectValue,
                setCustomerSelectValue,
                previsaoEntrega,
                setPrevisaoEntrega,
                completeRent
            }}>
            {children}
            {show && <RentsForm />}
            {showDeleteDialog && <RentsDeleteDialog />}
        </RentsContext.Provider>
    );
}

export default RentsContextProvider;
