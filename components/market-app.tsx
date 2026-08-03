"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BadgeDollarSign,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Minus,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShoppingBasket,
  ShoppingCart,
  Tags,
  Trash2,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ApiError,
  Category,
  marketApi,
  Movement,
  Product,
  Sale,
  User,
} from "@/lib/api";

type View =
  | "dashboard"
  | "products"
  | "categories"
  | "inventory"
  | "checkout"
  | "sales";

type Modal = "product" | "category" | "movement" | "settings" | null;
type CartItem = { product: Product; quantity: number };

const navItems: {
  view: View;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { view: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { view: "checkout", label: "Frente de caixa", icon: ShoppingBasket },
  { view: "products", label: "Produtos", icon: Package },
  { view: "categories", label: "Categorias", icon: Tags },
  { view: "inventory", label: "Estoque", icon: Boxes },
  { view: "sales", label: "Vendas", icon: ReceiptText },
];

const viewTitles: Record<View, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "Resumo de hoje", title: "Visão geral" },
  checkout: { eyebrow: "Nova operação", title: "Frente de caixa" },
  products: { eyebrow: "Catálogo", title: "Produtos" },
  categories: { eyebrow: "Organização", title: "Categorias" },
  inventory: { eyebrow: "Controle", title: "Movimentações de estoque" },
  sales: { eyebrow: "Histórico", title: "Vendas" },
};

const paymentLabels = {
  CASH: "Dinheiro",
  CREDIT_CARD: "Crédito",
  DEBIT_CARD: "Débito",
  PIX: "Pix",
};

const movementLabels = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  ADJUSTMENT: "Ajuste",
  SALE: "Venda",
  SALE_CANCELLATION: "Cancelamento",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function money(value: number | string) {
  return currency.format(Number(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Não foi possível concluir a operação.";
}

export function MarketApp() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const notify = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      window.setTimeout(() => setToast(null), 3600);
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, lowStockData, movementsData, salesData] =
        await Promise.all([
          marketApi.products(),
          marketApi.categories(),
          marketApi.lowStock(),
          marketApi.movements(),
          marketApi.sales(),
        ]);
      setProducts(productsData.data);
      setCategories(categoriesData);
      setLowStock(lowStockData);
      setMovements(movementsData.data);
      setSales(salesData.data);
      setApiOnline(true);
    } catch (error) {
      setApiOnline(false);
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem("market_token");
        localStorage.removeItem("market_user");
        setToken(null);
        setUser(null);
      } else {
        notify(getErrorMessage(error), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    queueMicrotask(() => {
      const savedUrl = localStorage.getItem("market_api_url");
      const savedToken = localStorage.getItem("market_token");
      const savedUser = localStorage.getItem("market_user");
      const defaultUrl = marketApi.getBaseUrl();
      const savedLocalUrl = savedUrl?.includes("localhost") ?? false;
      const productionDefault = !defaultUrl.includes("localhost");

      if (savedUrl && !(savedLocalUrl && productionDefault)) {
        marketApi.setBaseUrl(savedUrl);
      } else if (savedLocalUrl && productionDefault) {
        localStorage.removeItem("market_api_url");
      }
      if (savedToken && savedUser) {
        marketApi.setToken(savedToken);
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
      }
      setBooting(false);
    });
  }, []);

  useEffect(() => {
    if (token) queueMicrotask(() => void loadData());
  }, [token, loadData]);

  const handleLogin = async (email: string, password: string, apiUrl: string) => {
    marketApi.setBaseUrl(apiUrl);
    localStorage.setItem("market_api_url", apiUrl);
    const response = await marketApi.login(email, password);
    marketApi.setToken(response.accessToken);
    localStorage.setItem("market_token", response.accessToken);
    localStorage.setItem("market_user", JSON.stringify(response.user));
    setUser(response.user);
    setToken(response.accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("market_token");
    localStorage.removeItem("market_user");
    marketApi.setToken(null);
    setToken(null);
    setUser(null);
    setCart([]);
  };

  const selectView = (next: View) => {
    setView(next);
    setMobileMenu(false);
  };

  if (booting) {
    return (
      <main className="splash">
        <div className="brand-mark">m</div>
        <LoaderCircle className="spin" size={22} />
      </main>
    );
  }

  if (!user || !token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const canWrite = user.role !== "VIEWER";

  return (
    <main className="app-shell">
      <Sidebar
        user={user}
        view={view}
        mobileOpen={mobileMenu}
        onSelect={selectView}
        onClose={() => setMobileMenu(false)}
        onLogout={handleLogout}
        canWrite={canWrite}
      />

      <section className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Abrir menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={21} />
          </button>
          <div className="page-heading">
            <span>{viewTitles[view].eyebrow}</span>
            <h1>{viewTitles[view].title}</h1>
          </div>
          <div className="topbar-actions">
            <div
              className={`api-status ${apiOnline === false ? "offline" : ""}`}
              title={marketApi.getBaseUrl()}
            >
              {apiOnline === false ? <WifiOff size={15} /> : <Wifi size={15} />}
              <span>{apiOnline === false ? "API offline" : "API conectada"}</span>
            </div>
            <button
              className="icon-button"
              aria-label="Configurar API"
              onClick={() => setModal("settings")}
            >
              <Settings2 size={19} />
            </button>
            <button className="avatar-button" title={user.name}>
              {initials(user.name)}
            </button>
          </div>
        </header>

        <div className="content">
          {loading && <div className="loading-line" />}
          {view === "dashboard" && (
            <Dashboard
              products={products}
              sales={sales}
              lowStock={lowStock}
              movements={movements}
              onNavigate={selectView}
              canWrite={canWrite}
            />
          )}
          {view === "products" && (
            <ProductsView
              products={products}
              search={search}
              onSearch={setSearch}
              onNew={canWrite ? () => setModal("product") : undefined}
            />
          )}
          {view === "categories" && (
            <CategoriesView
              categories={categories}
              products={products}
              onNew={canWrite ? () => setModal("category") : undefined}
            />
          )}
          {view === "inventory" && (
            <InventoryView
              movements={movements}
              lowStock={lowStock}
              onNew={canWrite ? () => setModal("movement") : undefined}
            />
          )}
          {view === "checkout" && canWrite && (
            <CheckoutView
              products={products}
              cart={cart}
              setCart={setCart}
              onCompleted={() => {
                void loadData();
                notify("Venda finalizada com sucesso.");
              }}
              notify={notify}
            />
          )}
          {view === "sales" && (
            <SalesView
              sales={sales}
              onCancel={
                canWrite
                  ? async (sale) => {
                      if (!window.confirm(`Cancelar a venda #${sale.number}?`)) return;
                      try {
                        await marketApi.cancelSale(sale.id);
                        notify(`Venda #${sale.number} cancelada.`);
                        await loadData();
                      } catch (error) {
                        notify(getErrorMessage(error), "error");
                      }
                    }
                  : undefined
              }
            />
          )}
        </div>
      </section>

      {modal === "product" && canWrite && (
        <ProductModal
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            notify("Produto adicionado ao catálogo.");
            await loadData();
          }}
          notify={notify}
        />
      )}
      {modal === "category" && canWrite && (
        <CategoryModal
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            notify("Categoria criada.");
            await loadData();
          }}
          notify={notify}
        />
      )}
      {modal === "movement" && canWrite && (
        <MovementModal
          products={products}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            notify("Estoque atualizado.");
            await loadData();
          }}
          notify={notify}
        />
      )}
      {modal === "settings" && (
        <SettingsModal
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            notify("Endereço da API atualizado.");
            await loadData();
          }}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <Check size={17} /> : <AlertTriangle size={17} />}
          {toast.message}
        </div>
      )}
    </main>
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (email: string, password: string, apiUrl: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("consulta@market.local");
  const [password, setPassword] = useState("Viewerpassword");
  const [apiUrl, setApiUrl] = useState(marketApi.getBaseUrl());
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(email, password, apiUrl);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="brand-mark">m</span>
          <strong>mercatto.</strong>
        </div>
        <div className="story-copy">
          <span className="kicker">Gestão simples. Decisões melhores.</span>
          <h1>Seu mercado inteiro, em um só lugar.</h1>
          <p>
            Produtos, estoque e vendas organizados para você cuidar do que
            realmente importa: o seu negócio.
          </p>
        </div>
        <div className="story-stats">
          <div>
            <strong>01</strong>
            <span>Visão clara da operação</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Estoque sempre sob controle</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Caixa rápido e conectado</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card-header">
            <span className="mobile-brand">mercatto.</span>
            <p className="eyebrow">Acesso ao painel</p>
            <h2>Bem-vindo de volta</h2>
            <p>Entre com suas credenciais para continuar.</p>
          </div>

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button
            type="button"
            className="settings-link"
            onClick={() => setShowSettings((value) => !value)}
          >
            <Settings2 size={15} />
            Configurar endereço da API
          </button>
          {showSettings && (
            <label className="field api-field">
              <span>URL da API</span>
              <input
                type="url"
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                required
              />
            </label>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button login-submit" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={19} /> : "Entrar no painel"}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p className="login-hint">
            Acesso de demonstração: <strong>consulta@market.local</strong> /{" "}
            <strong>Viewerpassword</strong>
          </p>
        </form>
      </section>
    </main>
  );
}

function Sidebar({
  user,
  view,
  mobileOpen,
  onSelect,
  onClose,
  onLogout,
  canWrite,
}: {
  user: User;
  view: View;
  mobileOpen: boolean;
  onSelect: (view: View) => void;
  onClose: () => void;
  onLogout: () => void;
  canWrite: boolean;
}) {
  return (
    <>
      {mobileOpen && <button className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-mark">m</span>
            <strong>mercatto.</strong>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <p className="nav-label">Operação</p>
        <nav>
          {navItems
            .filter((item) => canWrite || item.view !== "checkout")
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  className={view === item.view ? "active" : ""}
                  onClick={() => onSelect(item.view)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {view === item.view && (
                    <ChevronRight className="nav-arrow" size={16} />
                  )}
                </button>
              );
            })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials(user.name)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "ADMIN"
                  ? "Administrador"
                  : user.role === "VIEWER"
                    ? "Somente consulta"
                    : "Operador"}
              </span>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Dashboard({
  products,
  sales,
  lowStock,
  movements,
  onNavigate,
  canWrite,
}: {
  products: Product[];
  sales: Sale[];
  lowStock: Product[];
  movements: Movement[];
  onNavigate: (view: View) => void;
  canWrite: boolean;
}) {
  const activeSales = sales.filter((sale) => sale.status === "COMPLETED");
  const revenue = activeSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const stockUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const recentSales = activeSales.slice(0, 5);
  const maxSale = Math.max(...recentSales.map((sale) => Number(sale.total)), 1);

  return (
    <div className="dashboard-grid">
      <section className="welcome-card">
        <div>
          <span className="kicker">Operação em movimento</span>
          <h2>Olá! Seu mercado está pronto para vender.</h2>
          <p>
            Acompanhe os números principais e resolva o que precisa de atenção.
          </p>
        </div>
        {canWrite && (
          <button className="light-button" onClick={() => onNavigate("checkout")}>
            Abrir caixa <ArrowRight size={17} />
          </button>
        )}
        <ShoppingBasket className="welcome-icon" size={142} strokeWidth={1.2} />
      </section>

      <div className="metric-grid">
        <MetricCard
          label="Receita registrada"
          value={money(revenue)}
          detail={`${activeSales.length} vendas concluídas`}
          icon={CircleDollarSign}
          accent="green"
        />
        <MetricCard
          label="Produtos ativos"
          value={String(products.filter((product) => product.active).length)}
          detail={`${stockUnits} unidades em estoque`}
          icon={Package}
          accent="blue"
        />
        <MetricCard
          label="Estoque baixo"
          value={String(lowStock.length)}
          detail={lowStock.length ? "Itens pedindo atenção" : "Tudo abastecido"}
          icon={AlertTriangle}
          accent="orange"
        />
        <MetricCard
          label="Ticket médio"
          value={money(activeSales.length ? revenue / activeSales.length : 0)}
          detail="Por venda concluída"
          icon={TrendingUp}
          accent="violet"
        />
      </div>

      <section className="panel sales-overview">
        <PanelHeader
          eyebrow="Desempenho"
          title="Vendas recentes"
          action={
            <button className="text-button" onClick={() => onNavigate("sales")}>
              Ver histórico <ArrowRight size={15} />
            </button>
          }
        />
        {recentSales.length ? (
          <div className="sales-bars">
            {recentSales
              .slice()
              .reverse()
              .map((sale) => (
                <div className="sales-bar-row" key={sale.id}>
                  <span>#{String(sale.number).padStart(4, "0")}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max((Number(sale.total) / maxSale) * 100, 8)}%` }}
                    />
                  </div>
                  <strong>{money(sale.total)}</strong>
                </div>
              ))}
          </div>
        ) : (
          <EmptyState
            icon={<BadgeDollarSign size={27} />}
            title="Nenhuma venda registrada"
            description="As primeiras vendas aparecerão aqui."
          />
        )}
      </section>

      <section className="panel attention-panel">
        <PanelHeader
          eyebrow="Atenção"
          title="Estoque crítico"
          action={
            <button className="text-button" onClick={() => onNavigate("inventory")}>
              Gerenciar <ArrowRight size={15} />
            </button>
          }
        />
        <div className="attention-list">
          {lowStock.slice(0, 5).map((product) => (
            <div className="attention-item" key={product.id}>
              <div className="product-symbol">{product.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{product.name}</strong>
                <span>{product.sku}</span>
              </div>
              <div className="stock-count danger">
                <strong>{product.stock}</strong>
                <span>mín. {product.minimumStock}</span>
              </div>
            </div>
          ))}
          {!lowStock.length && (
            <EmptyState
              icon={<Check size={26} />}
              title="Estoque saudável"
              description="Nenhum produto abaixo do mínimo."
            />
          )}
        </div>
      </section>

      <section className="panel activity-panel">
        <PanelHeader eyebrow="Agora" title="Últimas movimentações" />
        <div className="activity-list">
          {movements.slice(0, 6).map((movement) => (
            <div className="activity-item" key={movement.id}>
              <span className={`activity-icon ${movement.type.toLowerCase()}`}>
                {movement.type === "ENTRY" ||
                movement.type === "SALE_CANCELLATION" ? (
                  <ArrowDownToLine size={16} />
                ) : (
                  <ArrowUpFromLine size={16} />
                )}
              </span>
              <div>
                <strong>{movement.product?.name ?? "Produto"}</strong>
                <span>{movementLabels[movement.type]}</span>
              </div>
              <time>{dateTime.format(new Date(movement.createdAt))}</time>
            </div>
          ))}
          {!movements.length && (
            <EmptyState
              icon={<ClipboardList size={26} />}
              title="Sem movimentações"
              description="O histórico de estoque aparecerá aqui."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Package;
  accent: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${accent}`}>
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ProductsView({
  products,
  search,
  onSearch,
  onNew,
}: {
  products: Product[];
  search: string;
  onSearch: (value: string) => void;
  onNew?: () => void;
}) {
  const filtered = products.filter((product) =>
    [product.name, product.sku, product.barcode]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <section className="panel page-panel">
      <Toolbar
        search={search}
        onSearch={onSearch}
        placeholder="Buscar por nome, SKU ou código..."
        action={
          onNew ? (
            <button className="primary-button" onClick={onNew}>
              <Plus size={17} /> Novo produto
            </button>
          ) : undefined
        }
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <span className="product-symbol">
                      {product.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                  </div>
                </td>
                <td>{product.category?.name ?? "—"}</td>
                <td className="strong-cell">{money(product.price)}</td>
                <td>
                  <span
                    className={
                      product.stock <= product.minimumStock
                        ? "stock-inline danger"
                        : "stock-inline"
                    }
                  >
                    {product.stock} un.
                  </span>
                </td>
                <td>
                  <span className={`status ${product.active ? "success" : "muted"}`}>
                    {product.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <EmptyState
            icon={<Search size={26} />}
            title="Nenhum produto encontrado"
            description="Tente outro termo ou adicione um novo produto."
          />
        )}
      </div>
    </section>
  );
}

function CategoriesView({
  categories,
  products,
  onNew,
}: {
  categories: Category[];
  products: Product[];
  onNew?: () => void;
}) {
  return (
    <div className="category-layout">
      <div className="section-intro">
        <div>
          <p>
            Organize o catálogo em grupos para encontrar e analisar produtos com
            mais facilidade.
          </p>
        </div>
        {onNew && (
          <button className="primary-button" onClick={onNew}>
            <Plus size={17} /> Nova categoria
          </button>
        )}
      </div>
      <div className="category-grid">
        {categories.map((category, index) => {
          const count = products.filter(
            (product) => product.categoryId === category.id,
          ).length;
          return (
            <article className={`category-card tone-${(index % 4) + 1}`} key={category.id}>
              <div className="category-icon">
                <Tags size={22} />
              </div>
              <span className={`status ${category.active ? "success" : "muted"}`}>
                {category.active ? "Ativa" : "Inativa"}
              </span>
              <h3>{category.name}</h3>
              <p>{category.description || "Sem descrição adicionada."}</p>
              <div className="category-footer">
                <strong>{count}</strong>
                <span>{count === 1 ? "produto" : "produtos"}</span>
              </div>
            </article>
          );
        })}
        {!categories.length && (
          <EmptyState
            icon={<Tags size={27} />}
            title="Nenhuma categoria"
            description="Crie a primeira categoria do catálogo."
          />
        )}
      </div>
    </div>
  );
}

function InventoryView({
  movements,
  lowStock,
  onNew,
}: {
  movements: Movement[];
  lowStock: Product[];
  onNew?: () => void;
}) {
  return (
    <div className="inventory-layout">
      <section className="inventory-summary">
        <div className="summary-copy">
          <span className="kicker">Nível de atenção</span>
          <strong>{lowStock.length}</strong>
          <p>produtos abaixo ou no estoque mínimo</p>
        </div>
        <div className="summary-products">
          {lowStock.slice(0, 3).map((product) => (
            <div key={product.id}>
              <span>{product.name}</span>
              <strong>
                {product.stock} <small>/ {product.minimumStock}</small>
              </strong>
            </div>
          ))}
          {!lowStock.length && <p>Todos os produtos estão bem abastecidos.</p>}
        </div>
      </section>
      <section className="panel page-panel">
        <div className="inventory-toolbar">
          <div>
            <span className="eyebrow">Histórico</span>
            <h2>Movimentações</h2>
          </div>
          {onNew && (
            <button className="primary-button" onClick={onNew}>
              <Plus size={17} /> Nova movimentação
            </button>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Saldo</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{dateTime.format(new Date(movement.createdAt))}</td>
                  <td className="strong-cell">
                    {movement.product?.name ?? "Produto"}
                  </td>
                  <td>
                    <span className={`movement-type ${movement.type.toLowerCase()}`}>
                      {movementLabels[movement.type]}
                    </span>
                  </td>
                  <td className="strong-cell">{movement.quantity}</td>
                  <td>
                    {movement.previousStock} → {movement.currentStock}
                  </td>
                  <td>{movement.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CheckoutView({
  products,
  cart,
  setCart,
  onCompleted,
  notify,
}: {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCompleted: () => void;
  notify: (message: string, type?: "success" | "error") => void;
}) {
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<keyof typeof paymentLabels>("PIX");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const visible = products.filter(
    (product) =>
      product.active &&
      product.stock > 0 &&
      [product.name, product.sku, product.barcode]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const total = Math.max(subtotal - discount, 0);

  const add = (product: Product) => {
    setCart((items) => {
      const current = items.find((item) => item.product.id === product.id);
      if (current) {
        if (current.quantity >= product.stock) return items;
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (id: string, delta: number) => {
    setCart((items) =>
      items
        .map((item) =>
          item.product.id === id
            ? {
                ...item,
                quantity: Math.min(
                  item.product.stock,
                  Math.max(0, item.quantity + delta),
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const finish = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      await marketApi.createSale({
        paymentMethod: payment,
        discount,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });
      setCart([]);
      setDiscount(0);
      onCompleted();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-layout">
      <section className="catalog-panel">
        <div className="checkout-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto, SKU ou código de barras..."
            autoFocus
          />
        </div>
        <div className="checkout-product-grid">
          {visible.map((product) => (
            <button
              className="checkout-product"
              key={product.id}
              onClick={() => add(product)}
            >
              <div className="product-symbol">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
              <span>{product.category?.name ?? "Produto"}</span>
              <strong>{product.name}</strong>
              <div>
                <b>{money(product.price)}</b>
                <small>{product.stock} un.</small>
              </div>
              <Plus className="add-product-icon" size={17} />
            </button>
          ))}
        </div>
      </section>

      <aside className="cart-panel">
        <div className="cart-title">
          <div>
            <span className="eyebrow">Pedido atual</span>
            <h2>Carrinho</h2>
          </div>
          <span className="cart-count">{cart.length}</span>
        </div>
        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item" key={item.product.id}>
              <div className="cart-item-main">
                <strong>{item.product.name}</strong>
                <span>{money(item.product.price)} / un.</span>
              </div>
              <strong>{money(Number(item.product.price) * item.quantity)}</strong>
              <div className="quantity-control">
                <button onClick={() => changeQuantity(item.product.id, -1)}>
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => changeQuantity(item.product.id, 1)}>
                  <Plus size={14} />
                </button>
              </div>
              <button
                className="remove-item"
                onClick={() =>
                  setCart((items) =>
                    items.filter((cartItem) => cartItem.product.id !== item.product.id),
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!cart.length && (
            <EmptyState
              icon={<ShoppingCart size={28} />}
              title="Carrinho vazio"
              description="Clique em um produto para começar."
            />
          )}
        </div>
        <div className="cart-bottom">
          <label className="field compact">
            <span>Forma de pagamento</span>
            <select
              value={payment}
              onChange={(event) =>
                setPayment(event.target.value as keyof typeof paymentLabels)
              }
            >
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>Desconto (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(event) => setDiscount(Number(event.target.value))}
            />
          </label>
          <div className="totals">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Desconto</span>
              <strong>- {money(discount)}</strong>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
          </div>
          <button
            className="primary-button finish-button"
            disabled={!cart.length || submitting}
            onClick={() => void finish()}
          >
            {submitting ? <LoaderCircle className="spin" size={19} /> : <Check size={19} />}
            Finalizar venda
          </button>
        </div>
      </aside>
    </div>
  );
}

function SalesView({
  sales,
  onCancel,
}: {
  sales: Sale[];
  onCancel?: (sale: Sale) => Promise<void>;
}) {
  const [status, setStatus] = useState<"ALL" | Sale["status"]>("ALL");
  const filtered = sales.filter((sale) => status === "ALL" || sale.status === status);
  return (
    <section className="panel page-panel">
      <div className="sales-toolbar">
        <div className="segmented">
          {[
            ["ALL", "Todas"],
            ["COMPLETED", "Concluídas"],
            ["CANCELLED", "Canceladas"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={status === value ? "active" : ""}
              onClick={() => setStatus(value as typeof status)}
            >
              {label}
            </button>
          ))}
        </div>
        <span>{filtered.length} registros</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Venda</th>
              <th>Data</th>
              <th>Pagamento</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => (
              <tr key={sale.id}>
                <td className="strong-cell">#{String(sale.number).padStart(4, "0")}</td>
                <td>{dateTime.format(new Date(sale.createdAt))}</td>
                <td>{paymentLabels[sale.paymentMethod]}</td>
                <td>{sale.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}</td>
                <td className="strong-cell">{money(sale.total)}</td>
                <td>
                  <span
                    className={`status ${
                      sale.status === "COMPLETED" ? "success" : "danger"
                    }`}
                  >
                    {sale.status === "COMPLETED" ? "Concluída" : "Cancelada"}
                  </span>
                </td>
                <td>
                  {sale.status === "COMPLETED" && onCancel && (
                    <button
                      className="row-action"
                      onClick={() => void onCancel(sale)}
                      title="Cancelar venda"
                    >
                      <X size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductModal({
  categories,
  onClose,
  onSaved,
  notify,
}: {
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  notify: (message: string, type?: "success" | "error") => void;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      await marketApi.createProduct({
        name: String(data.get("name")),
        sku: String(data.get("sku")),
        barcode: String(data.get("barcode")),
        price: Number(data.get("price")),
        minimumStock: Number(data.get("minimumStock")),
        categoryId: String(data.get("categoryId")),
      });
      await onSaved();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <ModalShell
      title="Novo produto"
      subtitle="Adicione um item ao catálogo."
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label className="field full">
          <span>Nome do produto</span>
          <input name="name" minLength={2} required placeholder="Ex.: Café 500g" />
        </label>
        <label className="field">
          <span>SKU</span>
          <input name="sku" minLength={2} required placeholder="CAFE-001" />
        </label>
        <label className="field">
          <span>Código de barras</span>
          <input name="barcode" minLength={8} required placeholder="7890000000000" />
        </label>
        <label className="field">
          <span>Preço</span>
          <input name="price" type="number" min="0.01" step="0.01" required />
        </label>
        <label className="field">
          <span>Estoque mínimo</span>
          <input name="minimumStock" type="number" min="0" required />
        </label>
        <label className="field full">
          <span>Categoria</span>
          <select name="categoryId" required defaultValue="">
            <option value="" disabled>
              Selecione uma categoria
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <ModalActions onClose={onClose} saving={saving} label="Adicionar produto" />
      </form>
    </ModalShell>
  );
}

function CategoryModal({
  onClose,
  onSaved,
  notify,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
  notify: (message: string, type?: "success" | "error") => void;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      await marketApi.createCategory({
        name: String(data.get("name")),
        description: String(data.get("description")) || undefined,
      });
      await onSaved();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <ModalShell
      title="Nova categoria"
      subtitle="Crie um grupo para organizar seus produtos."
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label className="field full">
          <span>Nome</span>
          <input name="name" minLength={2} required placeholder="Ex.: Bebidas" />
        </label>
        <label className="field full">
          <span>Descrição</span>
          <textarea
            name="description"
            maxLength={255}
            rows={4}
            placeholder="Uma breve descrição da categoria"
          />
        </label>
        <ModalActions onClose={onClose} saving={saving} label="Criar categoria" />
      </form>
    </ModalShell>
  );
}

function MovementModal({
  products,
  onClose,
  onSaved,
  notify,
}: {
  products: Product[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  notify: (message: string, type?: "success" | "error") => void;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      await marketApi.createMovement({
        productId: String(data.get("productId")),
        type: String(data.get("type")) as "ENTRY" | "EXIT" | "ADJUSTMENT",
        quantity: Number(data.get("quantity")),
        reason: String(data.get("reason")),
      });
      await onSaved();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <ModalShell
      title="Movimentar estoque"
      subtitle="Registre uma entrada, saída ou ajuste."
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label className="field full">
          <span>Produto</span>
          <select name="productId" required defaultValue="">
            <option value="" disabled>
              Selecione um produto
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — saldo {product.stock}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo</span>
          <select name="type" required defaultValue="ENTRY">
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saída</option>
            <option value="ADJUSTMENT">Ajuste de saldo</option>
          </select>
        </label>
        <label className="field">
          <span>Quantidade</span>
          <input name="quantity" type="number" min="0" required />
        </label>
        <label className="field full">
          <span>Motivo</span>
          <input
            name="reason"
            minLength={3}
            required
            placeholder="Ex.: Reposição do fornecedor"
          />
        </label>
        <ModalActions onClose={onClose} saving={saving} label="Registrar movimentação" />
      </form>
    </ModalShell>
  );
}

function SettingsModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [url, setUrl] = useState(marketApi.getBaseUrl());
  return (
    <ModalShell
      title="Conexão com a API"
      subtitle="Informe o endereço onde o backend está rodando."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          marketApi.setBaseUrl(url);
          localStorage.setItem("market_api_url", url);
          void onSaved();
        }}
      >
        <label className="field full">
          <span>URL base</span>
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <small>Para uso local: http://localhost:3000/api</small>
        </label>
        <div className="connection-note">
          <Wifi size={18} />
          O front enviará as requisições diretamente para este endereço.
        </div>
        <ModalActions onClose={onClose} saving={false} label="Salvar endereço" />
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ModalActions({
  onClose,
  saving,
  label,
}: {
  onClose: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={onClose}>
        Cancelar
      </button>
      <button className="primary-button" disabled={saving}>
        {saving && <LoaderCircle className="spin" size={17} />}
        {label}
      </button>
    </div>
  );
}

function Toolbar({
  search,
  onSearch,
  placeholder,
  action,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  action: ReactNode;
}) {
  return (
    <div className="toolbar">
      <label className="search-field">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {action}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="panel-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </header>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
