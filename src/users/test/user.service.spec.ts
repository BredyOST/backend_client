import {Repository} from "typeorm";
import {UserEntity} from "../entities/user.entity";
import {getRepositoryToken} from "@nestjs/typeorm";
import {UsersService} from "../users.service";
import {Test, TestingModule} from "@nestjs/testing";
import {MailerService} from "@nestjs-modules/mailer";
import {LogsServiceOtherErrors} from "../../otherServices/loggerService/logger.service";
import {HttpService} from "@nestjs/axios";

const userInfo = {
    id: 1,
    email: 'test@example.com',
    forChangeEmail: '',
    phoneNumber: '+79292642644',
    forChangePhoneNumber: '',
    password: 'asdasd!@Sfd',
    fullName: '',
    isAdmin: false,
    isMainAdmin: false,
    isActivatedEmail: false,
    isActivatedPhone: false,
    activatedFreePeriod: false,
    endFreePeriod: false,
    activatedFreePeriodNotification: false,
    endFreePeriodNotification: false,
    sessionToken: '',
    ip: '',
    activationLink: '',
    activationNumber: '',
    categoriesFreePeriod: [],
    notificationsFreePeriod: [],
    categoriesHasBought: [],
    timeCallVerify: new Date('2023-11-03T22:50:03.585Z'),
    createdAt: new Date('2023-11-03T22:50:03.585Z'),
    updateAt: new Date('2023-11-03T22:50:03.585Z'),
    deletedAt: new Date('2023-11-03T22:50:03.585Z'),
};

describe('UsersService', () => {
    let usersService: UsersService;
    let mailerService: MailerService;
    let httpService: HttpService;
    let logsServiceOtherErrors: LogsServiceOtherErrors;
    let userRepositoryMock: MockType<Repository<UserEntity>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useFactory: repositoryMockFactory,
                },
                {
                    provide: MailerService,
                    useValue: {
                    },
                },
                {
                    provide: LogsServiceOtherErrors,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: HttpService,
                    useValue: {
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        mailerService = module.get<MailerService>(MailerService);
        httpService = module.get<HttpService>(HttpService);
        logsServiceOtherErrors = module.get<LogsServiceOtherErrors>(LogsServiceOtherErrors);
        userRepositoryMock = module.get(getRepositoryToken(UserEntity));
    });

    it('should find a user by email', async () => {
        const userEmail = 'test@example.com';
        const userEntity: UserEntity = new UserEntity();
        userEntity.email = userEmail;
        // Настройка мока репозитория
        userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(userEntity));
        // Вызов метода сервиса
        expect(await usersService.findByEmail(userEmail)).toEqual(userEmail);
        // Проверка того, что репозиторий был вызван с правильным аргументом
        expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: userEmail });
    });

    // Другие тесты для разных методов UsersService
});

// Вспомогательная функция для создания мока репозитория
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOneBy: jest.fn(entity => entity),
    // Другие методы репозитория, которые могут быть нужны
}));

export type MockType<T> = {
    [P in keyof T]?: jest.Mock<{}>;
};